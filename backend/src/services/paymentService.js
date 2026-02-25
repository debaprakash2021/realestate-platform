const Payment      = require('../models/Payment');
const Booking      = require('../models/Booking');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const crypto       = require('crypto');

// ─── Razorpay Setup (lazy-loaded so server starts even without key) ──
let razorpay = null;
const getRazorpay = () => {
  if (!razorpay) {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

const PAY_ON_ARRIVAL_SURCHARGE = 300; // ₹300 extra for pay on arrival

class PaymentService {

  // ─── Create Razorpay Order ────────────────────────────────────────
  static async createRazorpayOrder(guestId, bookingId, method) {
    const booking = await Booking.findOne({ _id: bookingId, guest: guestId })
      .populate('property', 'host title pricing')
      .populate('guest',    'name email phone');

    if (!booking) throw new Error('Booking not found');
    if (booking.payment?.status === 'held') throw new Error('Payment already made for this booking');

    const total          = booking.pricing.totalAmount;
    const amountInPaise  = Math.round(total * 100); // Razorpay uses paise

    const order = await getRazorpay().orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt:  `booking_${bookingId}`,
      notes: {
        bookingId:   bookingId.toString(),
        guestName:   booking.guest.name,
        guestEmail:  booking.guest.email,
        propertyName: booking.property.title
      }
    });

    return {
      orderId:     order.id,
      amount:      total,
      currency:    'INR',
      bookingId,
      guestName:   booking.guest.name,
      guestEmail:  booking.guest.email,
      guestPhone:  booking.guest.phone || '',
      propertyName: booking.property.title,
      keyId:       process.env.RAZORPAY_KEY_ID
    };
  }

  // ─── Verify Razorpay Payment + Hold Funds ────────────────────────
  static async verifyRazorpayPayment(guestId, bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    // 1. Verify signature
    const body      = razorpayOrderId + '|' + razorpayPaymentId;
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                            .update(body).digest('hex');
    if (expected !== razorpaySignature) throw new Error('Payment verification failed — invalid signature');

    return await this._createPaymentRecord(guestId, bookingId, 'card', {
      razorpayOrderId, razorpayPaymentId, razorpaySignature
    });
  }

  // ─── Pay on Arrival ───────────────────────────────────────────────
  static async payOnArrival(guestId, bookingId) {
    const booking = await Booking.findOne({ _id: bookingId, guest: guestId })
      .populate('property', 'host title');
    if (!booking) throw new Error('Booking not found');
    if (booking.payment?.status === 'held') throw new Error('Payment already made');

    return await this._createPaymentRecord(guestId, bookingId, 'pay_on_arrival', {});
  }

  // ─── Shared: Create Payment Record + Notify ──────────────────────
  static async _createPaymentRecord(guestId, bookingId, method, razorpayData) {
    const booking = await Booking.findById(bookingId)
      .populate('property', 'host title')
      .populate('guest',    'name email');

    const isPayOnArrival = method === 'pay_on_arrival';
    const surcharge      = isPayOnArrival ? PAY_ON_ARRIVAL_SURCHARGE : 0;
    const total          = booking.pricing.totalAmount + surcharge;
    const platformFee    = Math.round(total * 0.03);
    const hostPayout     = total - platformFee;

    const transactionId = `TXN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const payment = await Payment.create({
      booking: bookingId,
      guest:   guestId,
      host:    booking.property.host,
      amount:  { total, hostPayout, platformFee, surcharge, currency: 'INR' },
      status:  isPayOnArrival ? 'pay_on_arrival' : 'held',
      method,
      transactionId,
      razorpay: razorpayData.razorpayOrderId ? {
        orderId:   razorpayData.razorpayOrderId,
        paymentId: razorpayData.razorpayPaymentId,
        signature: razorpayData.razorpaySignature
      } : undefined,
      escrow: isPayOnArrival ? {} : {
        heldAt:   new Date(),
        releaseAt: new Date(booking.checkIn)
      }
    });

    // Update booking payment status
    await Booking.findByIdAndUpdate(bookingId, {
      'payment.status':        isPayOnArrival ? 'pay_on_arrival' : 'paid',
      'payment.method':        method,
      'payment.transactionId': transactionId,
      'payment.paidAt':        new Date()
    });

    // ─── Format for notifications ──────────────────────────────
    const methodLabel = {
      card:           '💳 Card/UPI (Online)',
      upi:            '📱 UPI',
      pay_on_arrival: '🏠 Pay on Arrival'
    }[method] || method;

    const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    // 🔔 Notify HOST — payment received with all booking details
    await Notification.create({
      user:    booking.property.host,
      type:    'payment_received',
      title:   `💰 Payment ${isPayOnArrival ? 'Promised' : 'Received'}: ${booking.property.title}`,
      message: `${booking.guest.name} has ${isPayOnArrival ? 'chosen Pay on Arrival (₹300 extra)' : `paid ₹${total.toLocaleString()} via ${methodLabel}`} for "${booking.property.title}" · Check-in: ${fmt(booking.checkIn)} · Check-out: ${fmt(booking.checkOut)} · ${booking.nights} night${booking.nights > 1 ? 's' : ''} · Your payout: ₹${hostPayout.toLocaleString()} · Booking ID: ${bookingId}`,
      data:    { bookingId, propertyId: booking.property._id, paymentId: payment._id }
    });

    // 🔔 Notify GUEST — payment success
    await Notification.create({
      user:    guestId,
      type:    'payment_received',
      title:   `✅ Payment ${isPayOnArrival ? 'Pending at Arrival' : 'Successful'}!`,
      message: isPayOnArrival
        ? `You chose Pay on Arrival for "${booking.property.title}". ₹${total.toLocaleString()} (includes ₹300 surcharge) to be paid at check-in. Transaction ID: ${transactionId}`
        : `₹${total.toLocaleString()} paid successfully via ${methodLabel} for "${booking.property.title}". Transaction ID: ${transactionId}`,
      data:    { bookingId, paymentId: payment._id }
    });

    return await payment.populate([
      { path: 'guest',   select: 'name email' },
      { path: 'host',    select: 'name email' },
      { path: 'booking', select: 'checkIn checkOut nights pricing status' }
    ]);
  }

  // ─── Initiate Simple Payment (card/upi without Razorpay — fallback) ──
  static async initiatePayment(guestId, bookingId, method = 'card') {
    const booking = await Booking.findOne({ _id: bookingId, guest: guestId })
      .populate('property', 'host pricing');
    if (!booking) throw new Error('Booking not found');
    if (booking.payment?.status === 'held') throw new Error('Payment already made');
    return await this._createPaymentRecord(guestId, bookingId, method, {});
  }

  // ─── Release Payment to Host (admin) ─────────────────────────────
  static async releasePayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (!['held', 'pay_on_arrival'].includes(payment.status)) throw new Error(`Payment is ${payment.status}, cannot release`);
    payment.status            = 'released';
    payment.escrow.releasedAt = new Date();
    payment.escrow.releasedBy = 'admin';
    await payment.save();
    return payment;
  }

  // ─── Refund Payment (admin) ───────────────────────────────────────
  static async refundPayment(paymentId, reason, refundAmount = null) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (!['held', 'pay_on_arrival'].includes(payment.status)) throw new Error('Only held payments can be refunded');
    const amount     = refundAmount || payment.amount.total;
    payment.status   = 'refunded';
    payment.refund   = { amount, reason, refundedAt: new Date() };
    await payment.save();
    await Booking.findByIdAndUpdate(payment.booking, {
      'payment.status': 'refunded', 'payment.refundedAt': new Date()
    });
    return payment;
  }

  // ─── Get Payment by Booking ───────────────────────────────────────
  static async getPaymentByBooking(bookingId, userId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found');
    const isGuest = booking.guest.toString() === userId.toString();
    const isHost  = booking.host.toString()  === userId.toString();
    if (!isGuest && !isHost) throw new Error('Not authorized');
    const payment = await Payment.findOne({ booking: bookingId })
      .populate('guest',   'name email')
      .populate('host',    'name email')
      .populate('booking', 'checkIn checkOut nights pricing status');
    if (!payment) throw new Error('No payment found for this booking');
    return payment;
  }

  // ─── Guest Payment History ────────────────────────────────────────
  static async getGuestPayments(guestId) {
    return await Payment.find({ guest: guestId })
      .populate('booking', 'checkIn checkOut nights pricing status')
      .populate('host',    'name email')
      .sort({ createdAt: -1 });
  }

  // ─── Host Earnings ────────────────────────────────────────────────
  static async getHostEarnings(hostId) {
    const payments = await Payment.find({ host: hostId })
      .populate('booking', 'checkIn checkOut nights pricing status')
      .populate('guest',   'name email')
      .sort({ createdAt: -1 });

    const totalEarned   = payments.filter(p => p.status === 'released').reduce((s, p) => s + p.amount.hostPayout, 0);
    const pendingPayout = payments.filter(p => p.status === 'held').reduce((s, p) => s + p.amount.hostPayout, 0);

    return { payments, totalEarned, pendingPayout };
  }

  // ─── Admin: All Payments ──────────────────────────────────────────
  static async getAllPayments(query = {}) {
    const { page = 1, limit = 20, status, guestId, hostId } = query;
    const filter = {};
    if (status)  filter.status = status;
    if (guestId) filter.guest  = guestId;
    if (hostId)  filter.host   = hostId;
    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('guest',   'name email phone')
        .populate('host',    'name email')
        .populate('booking', 'checkIn checkOut nights pricing status property')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Payment.countDocuments(filter)
    ]);
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'released' } },
      { $group: { _id: null, total: { $sum: '$amount.platformFee' } } }
    ]);
    return { payments, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }, platformRevenue: totalRevenue[0]?.total || 0 };
  }
}

module.exports = PaymentService;
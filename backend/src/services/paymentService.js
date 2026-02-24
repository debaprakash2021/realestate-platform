const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const crypto  = require('crypto');

class PaymentService {

  // ─── Initiate Payment (hold funds in escrow) ──────────────────────
  static async initiatePayment(guestId, bookingId, method = 'card') {
    const booking = await Booking.findOne({ _id: bookingId, guest: guestId })
      .populate('property', 'host pricing');

    if (!booking) throw new Error('Booking not found');
    if (booking.payment?.status === 'held') throw new Error('Payment already made for this booking');

    const total       = booking.pricing.totalAmount;
    const platformFee = Math.round(total * 0.03);   // 3% platform fee
    const hostPayout  = total - platformFee;

    // Simulate transaction ID
    const transactionId = `TXN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const payment = await Payment.create({
      booking:       bookingId,
      guest:         guestId,
      host:          booking.property.host,
      amount: {
        total,
        hostPayout,
        platformFee,
        currency: booking.pricing.currency || 'INR'
      },
      status:        'held',
      method,
      transactionId,
      escrow: {
        heldAt:    new Date(),
        releaseAt: new Date(booking.checkIn) // release after check-in
      }
    });

    // Update booking payment status
    await Booking.findByIdAndUpdate(bookingId, {
      'payment.status':        'paid',
      'payment.method':        method,
      'payment.transactionId': transactionId,
      'payment.paidAt':        new Date()
    });

    return await payment.populate([
      { path: 'guest',   select: 'name email' },
      { path: 'host',    select: 'name email' },
      { path: 'booking', select: 'checkIn checkOut nights pricing' }
    ]);
  }

  // ─── Release Payment to Host ──────────────────────────────────────
  static async releasePayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'held') throw new Error(`Payment is ${payment.status}, cannot release`);

    payment.status             = 'released';
    payment.escrow.releasedAt  = new Date();
    payment.escrow.releasedBy  = 'system';
    await payment.save();

    return payment;
  }

  // ─── Refund Payment ───────────────────────────────────────────────
  static async refundPayment(paymentId, reason, refundAmount = null) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'held') throw new Error('Only held payments can be refunded');

    const amount = refundAmount || payment.amount.total;

    payment.status       = 'refunded';
    payment.refund       = {
      amount,
      reason,
      refundedAt: new Date()
    };
    await payment.save();

    // Update booking
    await Booking.findByIdAndUpdate(payment.booking, {
      'payment.status':     'refunded',
      'payment.refundedAt': new Date()
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

  // ─── Get My Payments (guest) ──────────────────────────────────────
  static async getGuestPayments(guestId) {
    return await Payment.find({ guest: guestId })
      .populate('booking', 'checkIn checkOut nights pricing status')
      .populate('host',    'name email')
      .sort({ createdAt: -1 });
  }

  // ─── Get My Earnings (host) ───────────────────────────────────────
  static async getHostEarnings(hostId) {
    const payments = await Payment.find({ host: hostId })
      .populate('booking', 'checkIn checkOut nights pricing status')
      .populate('guest',   'name email')
      .sort({ createdAt: -1 });

    const totalEarned  = payments
      .filter(p => p.status === 'released')
      .reduce((sum, p) => sum + p.amount.hostPayout, 0);

    const pendingPayout = payments
      .filter(p => p.status === 'held')
      .reduce((sum, p) => sum + p.amount.hostPayout, 0);

    return { payments, totalEarned, pendingPayout };
  }
}

module.exports = PaymentService;
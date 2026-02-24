const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

class BookingService {

  // ─── Calculate Pricing ───────────────────────────────────────────
  static calculatePricing(property, checkIn, checkOut) {
    const nights = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );

    const basePrice   = property.pricing.basePrice;
    let subtotal      = basePrice * nights;
    let discountAmount = 0;

    // Apply weekly discount (7+ nights)
    if (nights >= 7 && nights < 30 && property.pricing.weeklyDiscount > 0) {
      discountAmount = subtotal * (property.pricing.weeklyDiscount / 100);
    }

    // Apply monthly discount (30+ nights)
    if (nights >= 30 && property.pricing.monthlyDiscount > 0) {
      discountAmount = subtotal * (property.pricing.monthlyDiscount / 100);
    }

    const cleaningFee     = property.pricing.cleaningFee     || 0;
    const serviceFee      = property.pricing.serviceFee      || 0;
    const securityDeposit = property.pricing.securityDeposit || 0;

    const totalAmount = subtotal - discountAmount + cleaningFee + serviceFee + securityDeposit;

    return {
      basePrice,
      nights,
      subtotal,
      weeklyDiscount:  nights >= 7 && nights < 30  ? discountAmount : 0,
      monthlyDiscount: nights >= 30                 ? discountAmount : 0,
      cleaningFee,
      serviceFee,
      securityDeposit,
      totalAmount:     Math.round(totalAmount * 100) / 100,
      currency:        property.pricing.currency || 'USD'
    };
  }

  // ─── Calculate Refund (based on cancellation policy) ─────────────
  static calculateRefund(booking) {
    const policy      = booking.cancellation?.policy || 'moderate';
    const totalAmount = booking.pricing.totalAmount;
    const now         = new Date();
    const checkIn     = new Date(booking.checkIn);
    const daysToCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));

    let refundAmount = 0;

    if (policy === 'flexible') {
      // Full refund if cancelled 1+ day before check-in
      refundAmount = daysToCheckIn >= 1 ? totalAmount : 0;
    } else if (policy === 'moderate') {
      // Full refund if cancelled 5+ days before check-in
      refundAmount = daysToCheckIn >= 5 ? totalAmount : 0;
    } else if (policy === 'strict') {
      // 50% refund if cancelled 7+ days before check-in
      if (daysToCheckIn >= 7) {
        refundAmount = totalAmount * 0.5;
      } else {
        refundAmount = 0;
      }
    }

    return Math.round(refundAmount * 100) / 100;
  }

  // ─── Create Booking ──────────────────────────────────────────────
  static async createBooking(guestId, data) {
    const { propertyId, checkIn, checkOut, guests, specialRequests } = data;

    // 1. Get property
    const property = await Property.findById(propertyId).populate('host');
    if (!property) throw new Error('Property not found');
    if (property.status !== 'active') throw new Error('Property is not available');

    // 2. Validate dates
    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today        = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today)        throw new Error('Check-in date cannot be in the past');
    if (checkOutDate <= checkInDate) throw new Error('Check-out must be after check-in');

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights < property.houseRules.minNights) {
      throw new Error(`Minimum stay is ${property.houseRules.minNights} night(s)`);
    }
    if (nights > property.houseRules.maxNights) {
      throw new Error(`Maximum stay is ${property.houseRules.maxNights} night(s)`);
    }

    // 3. Check guest count
    const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
    if (totalGuests > property.details.maxGuests) {
      throw new Error(`Maximum ${property.details.maxGuests} guests allowed`);
    }

    // 4. ⚡ CONFLICT PREVENTION — Check for overlapping bookings
    const hasConflict = await Booking.hasConflict(propertyId, checkIn, checkOut);
    if (hasConflict) {
      throw new Error('Property is not available for the selected dates');
    }

    // 5. Check property availability calendar
    if (!property.isAvailable(checkIn, checkOut)) {
      throw new Error('Property is blocked for the selected dates');
    }

    // 6. Calculate pricing
    const pricing = this.calculatePricing(property, checkIn, checkOut);

    // 7. Create booking
    const booking = await Booking.create({
      property:         propertyId,
      guest:            guestId,
      host:             property.host._id,
      checkIn:          checkInDate,
      checkOut:         checkOutDate,
      nights,
      guests: {
        adults:   guests?.adults   || 1,
        children: guests?.children || 0,
        infants:  guests?.infants  || 0,
        total:    totalGuests
      },
      pricing,
      status:           property.instantBooking ? 'confirmed' : 'pending',
      isInstantBooking: property.instantBooking,
      cancellation: {
        policy: property.cancellationPolicy
      },
      specialRequests: specialRequests || ''
    });

    // 8. Block the dates on the property
    await Property.findByIdAndUpdate(propertyId, {
      $push: {
        blockedDates: {
          startDate: checkInDate,
          endDate:   checkOutDate,
          reason:    'booked'
        }
      },
      $inc: { 'stats.totalBookings': 1 }
    });

    return await booking.populate([
      { path: 'property', select: 'title location images pricing' },
      { path: 'guest',    select: 'name email avatar' },
      { path: 'host',     select: 'name email avatar' }
    ]);
  }

  // ─── Get All Bookings (admin) ─────────────────────────────────────
  static async getAllBookings(query) {
    const { status, page = 1, limit = 10 } = query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('property', 'title location')
        .populate('guest',    'name email')
        .populate('host',     'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    return { bookings, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  }

  // ─── Get Single Booking ───────────────────────────────────────────
  static async getBookingById(bookingId, userId) {
    const booking = await Booking.findById(bookingId)
      .populate('property', 'title location images houseRules cancellationPolicy')
      .populate('guest',    'name email avatar phone')
      .populate('host',     'name email avatar phone');

    if (!booking) throw new Error('Booking not found');

    // Only guest, host or admin can view
    const isGuest = booking.guest._id.toString() === userId.toString();
    const isHost  = booking.host._id.toString()  === userId.toString();
    if (!isGuest && !isHost) throw new Error('Not authorized to view this booking');

    return booking;
  }

  // ─── Get Guest Bookings ───────────────────────────────────────────
  static async getGuestBookings(guestId, query) {
    const { status, page = 1, limit = 10 } = query;
    const filter = { guest: guestId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('property', 'title location images pricing')
        .populate('host',     'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    return { bookings, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  }

  // ─── Get Host Bookings ────────────────────────────────────────────
  static async getHostBookings(hostId, query) {
    const { status, page = 1, limit = 10 } = query;
    const filter = { host: hostId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('property', 'title location images')
        .populate('guest',    'name email avatar phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    return { bookings, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } };
  }

  // ─── Confirm Booking (host action) ───────────────────────────────
  static async confirmBooking(bookingId, hostId) {
    const booking = await Booking.findOne({ _id: bookingId, host: hostId });
    if (!booking)               throw new Error('Booking not found or unauthorized');
    if (booking.status !== 'pending') throw new Error('Only pending bookings can be confirmed');

    booking.status         = 'confirmed';
    booking.payment.status = 'held';  // funds held in escrow
    booking.payment.paidAt = new Date();
    await booking.save();

    return booking;
  }

  // ─── Reject Booking (host action) ────────────────────────────────
  static async rejectBooking(bookingId, hostId, reason) {
    const booking = await Booking.findOne({ _id: bookingId, host: hostId });
    if (!booking)               throw new Error('Booking not found or unauthorized');
    if (booking.status !== 'pending') throw new Error('Only pending bookings can be rejected');

    booking.status = 'rejected';
    booking.cancellation.cancelledBy = hostId;
    booking.cancellation.cancelledAt = new Date();
    booking.cancellation.reason      = reason || 'Rejected by host';

    // Unblock the dates on property
    await Property.findByIdAndUpdate(booking.property, {
      $pull: {
        blockedDates: {
          startDate: booking.checkIn,
          endDate:   booking.checkOut
        }
      }
    });

    await booking.save();
    return booking;
  }

  // ─── Cancel Booking (guest or host) ──────────────────────────────
  static async cancelBooking(bookingId, userId, reason) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    const isGuest = booking.guest.toString() === userId.toString();
    const isHost  = booking.host.toString()  === userId.toString();
    if (!isGuest && !isHost) throw new Error('Not authorized to cancel this booking');

    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new Error('This booking cannot be cancelled');
    }

    // Calculate refund
    const refundAmount = this.calculateRefund(booking);

    booking.status                   = 'cancelled';
    booking.cancellation.cancelledBy = userId;
    booking.cancellation.cancelledAt = new Date();
    booking.cancellation.reason      = reason || 'Cancelled by user';
    booking.cancellation.refundAmount = refundAmount;
    booking.payment.status           = refundAmount > 0 ? 'refunded' : 'held';
    booking.payment.refundedAt       = refundAmount > 0 ? new Date() : undefined;

    // Unblock the dates on property
    await Property.findByIdAndUpdate(booking.property, {
      $pull: {
        blockedDates: {
          startDate: booking.checkIn,
          endDate:   booking.checkOut
        }
      }
    });

    await booking.save();
    return { booking, refundAmount };
  }

  // ─── Complete Booking & Release Payment (auto after checkout) ─────
  static async completeBooking(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking)                    throw new Error('Booking not found');
    if (booking.status !== 'confirmed') throw new Error('Only confirmed bookings can be completed');

    booking.status             = 'completed';
    booking.payment.status     = 'released';
    booking.payment.releasedAt = new Date();

    // Update host earnings
    await require('../models/User').findByIdAndUpdate(booking.host, {
      $inc: {
        'hostInfo.totalEarnings': booking.pricing.totalAmount,
        'stats.totalBookings':    1
      }
    });

    await booking.save();
    return booking;
  }
}

module.exports = BookingService;
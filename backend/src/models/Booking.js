const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({

  // ─── Core References ──────────────────────────────────────────
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property is required']
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Guest is required']
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host is required']
  },

  // ─── Dates ────────────────────────────────────────────────────
  checkIn: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOut: {
    type: Date,
    required: [true, 'Check-out date is required']
  },
  nights: {
    type: Number,
    min: [1, 'Minimum 1 night required']
  },

  // ─── Guests ───────────────────────────────────────────────────
  guests: {
    adults:   { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 },
    infants:  { type: Number, default: 0, min: 0 },
    total:    { type: Number, default: 1 }
  },

  // ─── Pricing Breakdown ────────────────────────────────────────
  pricing: {
    basePrice:       { type: Number, required: true },
    nights:          { type: Number, required: true },
    subtotal:        { type: Number, required: true },
    weeklyDiscount:  { type: Number, default: 0 },
    monthlyDiscount: { type: Number, default: 0 },
    cleaningFee:     { type: Number, default: 0 },
    serviceFee:      { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    totalAmount:     { type: Number, required: true },
    // FIX #1: Was 'USD' — changed to 'INR' since this is an India-focused platform
    currency:        { type: String, default: 'INR' }
  },

  // ─── Booking Status ───────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
    default: 'pending'
  },

  // ─── Payment / Escrow ─────────────────────────────────────────
  payment: {
    status: {
      type: String,
      // FIX #2: 'pay_on_arrival' was missing from enum.
      // PaymentService sets this value, causing a MongoValidationError on save.
      // GuestDashboard also reads this value for payment history display.
      enum: ['pending', 'held', 'released', 'refunded', 'failed', 'pay_on_arrival'],
      default: 'pending'
    },
    method:        { type: String, default: 'card' },
    transactionId: { type: String },
    paidAt:        { type: Date },
    releasedAt:    { type: Date },
    refundedAt:    { type: Date }
  },

  // ─── Cancellation ─────────────────────────────────────────────
  cancellation: {
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt:  { type: Date },
    reason:       { type: String },
    refundAmount: { type: Number, default: 0 },
    policy:       { type: String, enum: ['flexible', 'moderate', 'strict'] }
  },

  // ─── Special Requests ─────────────────────────────────────────
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },

  // ─── Flags ────────────────────────────────────────────────────
  isInstantBooking: { type: Boolean, default: false },
  hasReview:        { type: Boolean, default: false },
  guestConfirmed:   { type: Boolean, default: false },

}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Indexes ─────────────────────────────────────────────────────
bookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ host: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payment.status': 1 });

// ─── Pre-save: Calculate nights ──────────────────────────────────
bookingSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffTime = new Date(this.checkOut) - new Date(this.checkIn);
    this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  next();
});

// ─── Virtual: Duration label ─────────────────────────────────────
bookingSchema.virtual('duration').get(function() {
  return `${this.nights} night${this.nights > 1 ? 's' : ''}`;
});

// ─── Static: Check for conflicting bookings ───────────────────────
bookingSchema.statics.hasConflict = async function(propertyId, checkIn, checkOut, excludeBookingId = null) {
  const query = {
    property: propertyId,
    status:   { $in: ['pending', 'confirmed'] },
    $or: [
      { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await this.findOne(query);
  return !!conflict;
};

module.exports = mongoose.model('Booking', bookingSchema);
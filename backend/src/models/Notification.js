const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

  // ─── Recipient ────────────────────────────────────────────────
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Notification Type ────────────────────────────────────────
  type: {
    type: String,
    enum: [
      'booking_confirmed',
      'booking_cancelled',
      'booking_completed',
      'payment_received',
      'payment_released',
      'payment_refunded',
      'review_received',
      'review_response',
      'message_received',
      'property_approved',
      'system'
    ],
    required: true
  },

  // ─── Content ──────────────────────────────────────────────────
  title:   { type: String, required: true },
  message: { type: String, required: true },

  // ─── Related References (optional) ───────────────────────────
  data: {
    bookingId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    reviewId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
    paymentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
  },

  // ─── Status ───────────────────────────────────────────────────
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date

}, {
  timestamps: true
});

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
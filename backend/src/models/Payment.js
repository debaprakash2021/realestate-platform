const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

  // ─── References ───────────────────────────────────────────────
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Amount Details ───────────────────────────────────────────
  amount: {
    total:          { type: Number, required: true },
    hostPayout:     { type: Number, required: true },  // 97% of total
    platformFee:    { type: Number, required: true },  // 3% platform cut
    currency:       { type: String, default: 'INR' }
  },

  // ─── Payment Status ───────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'failed'],
    default: 'pending'
  },

  // ─── Payment Method ───────────────────────────────────────────
  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    default: 'card'
  },

  // ─── Escrow Logic ─────────────────────────────────────────────
  escrow: {
    heldAt:      Date,   // when funds were held
    releaseAt:   Date,   // scheduled release (after check-in)
    releasedAt:  Date,   // actual release
    releasedBy:  { type: String, enum: ['system', 'admin'] }
  },

  // ─── Refund Details ───────────────────────────────────────────
  refund: {
    amount:     Number,
    reason:     String,
    refundedAt: Date
  },

  // ─── Transaction ID (simulated) ───────────────────────────────
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  }

}, {
  timestamps: true
});

paymentSchema.index({ booking: 1 });
paymentSchema.index({ guest: 1 });
paymentSchema.index({ host: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
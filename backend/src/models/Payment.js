const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  guest:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  host:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

  amount: {
    total:       { type: Number, required: true },
    hostPayout:  { type: Number, required: true },  // 97% of total
    platformFee: { type: Number, required: true },  // 3% platform cut
    surcharge:   { type: Number, default: 0 },      // +300 for pay_on_arrival
    currency:    { type: String, default: 'INR' }
  },

  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'failed', 'pay_on_arrival'],
    default: 'pending'
  },

  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'pay_on_arrival'],
    default: 'card'
  },

  // ─── Razorpay Fields ──────────────────────────────────────────
  razorpay: {
    orderId:    String,   // from Razorpay order creation
    paymentId:  String,   // from Razorpay after success
    signature:  String    // for verification
  },

  // ─── Escrow Logic ─────────────────────────────────────────────
  escrow: {
    heldAt:     Date,
    releaseAt:  Date,
    releasedAt: Date,
    releasedBy: { type: String, enum: ['system', 'admin'] }
  },

  refund: {
    amount:     Number,
    reason:     String,
    refundedAt: Date
  },

  transactionId: { type: String, unique: true, sparse: true }

}, { timestamps: true });

paymentSchema.index({ booking: 1 });
paymentSchema.index({ guest: 1 });
paymentSchema.index({ host: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
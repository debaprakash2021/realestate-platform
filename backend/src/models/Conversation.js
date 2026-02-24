const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({

  // ─── Participants ─────────────────────────────────────────────
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Property Reference ───────────────────────────────────────
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },

  // ─── Booking Reference (optional) ────────────────────────────
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },

  // ─── Last Message Preview ────────────────────────────────────
  lastMessage: {
    content:   { type: String, default: '' },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date }
  },

  // ─── Unread Counts ────────────────────────────────────────────
  unreadCount: {
    host:  { type: Number, default: 0 },
    guest: { type: Number, default: 0 }
  },

  // ─── Status ───────────────────────────────────────────────────
  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// One conversation per guest+host+property combination
conversationSchema.index({ host: 1, guest: 1, property: 1 }, { unique: true });
conversationSchema.index({ guest: 1 });
conversationSchema.index({ host: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
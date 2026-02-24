const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  // ─── Conversation Reference ───────────────────────────────────
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  // ─── Sender ───────────────────────────────────────────────────
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ─── Content ──────────────────────────────────────────────────
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    trim: true
  },

  // ─── Attachments ──────────────────────────────────────────────
  attachments: [{
    url:      String,
    publicId: String,
    type:     { type: String, enum: ['image', 'document'] }
  }],

  // ─── Read Status ──────────────────────────────────────────────
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,

  // ─── Soft Delete ──────────────────────────────────────────────
  isDeleted: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
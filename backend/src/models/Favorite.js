const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({

  // ─── References ───────────────────────────────────────────────
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  }

}, {
  timestamps: true
});

// One favorite per user+property combination
favoriteSchema.index({ user: 1, property: 1 }, { unique: true });
favoriteSchema.index({ user: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
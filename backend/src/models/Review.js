const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({

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
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking is required']
  },

  // ─── Ratings (each out of 5) ──────────────────────────────────
  ratings: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    cleanliness:   { type: Number, min: 1, max: 5 },
    accuracy:      { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    location:      { type: Number, min: 1, max: 5 },
    checkIn:       { type: Number, min: 1, max: 5 },
    value:         { type: Number, min: 1, max: 5 }
  },

  // ─── Review Content ───────────────────────────────────────────
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
    trim: true
  },

  // ─── Review Images ────────────────────────────────────────────
  images: [{
    url:      String,
    publicId: String
  }],

  // ─── Host Response ────────────────────────────────────────────
  hostResponse: {
    comment: {
      type: String,
      maxlength: [500, 'Host response cannot exceed 500 characters'],
      trim: true
    },
    respondedAt: Date
  },

  // ─── Flags ────────────────────────────────────────────────────
  isVerified: {
    type: Boolean,
    default: true  // only verified stays can review
  },
  isVisible: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Indexes ──────────────────────────────────────────────────────
reviewSchema.index({ property: 1 });
reviewSchema.index({ guest: 1 });
reviewSchema.index({ booking: 1 }, { unique: true }); // one review per booking

// ─── Post-save: Update property ratings automatically ─────────────
reviewSchema.post('save', async function() {
  await updatePropertyRatings(this.property);
});

reviewSchema.post('remove', async function() {
  await updatePropertyRatings(this.property);
});

// ─── Helper: Recalculate & update property average ratings ────────
const updatePropertyRatings = async (propertyId) => {
  const Review    = mongoose.model('Review');
  const Property  = mongoose.model('Property');

  const reviews = await Review.find({ property: propertyId, isVisible: true });

  if (reviews.length === 0) {
    await Property.findByIdAndUpdate(propertyId, {
      'ratings.average':       0,
      'ratings.count':         0,
      'ratings.cleanliness':   0,
      'ratings.accuracy':      0,
      'ratings.communication': 0,
      'ratings.location':      0,
      'ratings.checkIn':       0,
      'ratings.value':         0
    });
    return;
  }

  // Calculate averages for each category
  const avg = (field) => {
    const vals = reviews.map(r => r.ratings[field]).filter(v => v > 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  };

  await Property.findByIdAndUpdate(propertyId, {
    'ratings.average':       avg('overall'),
    'ratings.count':         reviews.length,
    'ratings.cleanliness':   avg('cleanliness'),
    'ratings.accuracy':      avg('accuracy'),
    'ratings.communication': avg('communication'),
    'ratings.location':      avg('location'),
    'ratings.checkIn':       avg('checkIn'),
    'ratings.value':         avg('value')
  });
};

module.exports = mongoose.model('Review', reviewSchema);
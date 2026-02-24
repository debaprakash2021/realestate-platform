const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  // ─── Basic Info ───────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,        // this already creates an index, no need for userSchema.index({ email: 1 })
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false        // never return password in queries
  },

  // ─── Role ─────────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['guest', 'host', 'admin'],
    default: 'guest'    // guest = person looking to book, host = property owner
  },

  // ─── Profile ──────────────────────────────────────────────────
  avatar: {
    url: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },
    publicId: String    // Cloudinary public ID for deletion
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    city: String,
    country: String
  },

  // ─── Host Info (only relevant if role = host) ─────────────────
  hostInfo: {
    isVerified:        { type: Boolean, default: false },
    responseRate:      { type: Number, default: 0 },   // percentage 0-100
    responseTime:      { type: String, default: 'within a day' },
    totalListings:     { type: Number, default: 0 },
    totalEarnings:     { type: Number, default: 0 },
    joinedAsHostDate:  { type: Date }
  },

  // ─── Account Status ───────────────────────────────────────────
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // ─── Stats ────────────────────────────────────────────────────
  stats: {
    totalBookings:   { type: Number, default: 0 },
    totalSpent:      { type: Number, default: 0 },
    totalReviews:    { type: Number, default: 0 }
  }

}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true }
});

// ─── Indexes ─────────────────────────────────────────────────────
// NOTE: Do NOT add userSchema.index({ email: 1 }) — unique:true above already does it
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── Pre-save: Hash Password ──────────────────────────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Method: Compare Password ─────────────────────────────────────
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── Virtual: User's Properties (if host) ────────────────────────
userSchema.virtual('properties', {
  ref:        'Property',
  localField: '_id',
  foreignField: 'host'
});

// ─── Virtual: User's Bookings (if guest) ─────────────────────────
userSchema.virtual('bookings', {
  ref:        'Booking',
  localField: '_id',
  foreignField: 'guest'
});

module.exports = mongoose.model('User', userSchema);
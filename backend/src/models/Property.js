const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({

    // ─── Basic Info ───────────────────────────────────────────────
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true,
        minlength: [10, 'Title must be at least 10 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [50, 'Description must be at least 50 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    propertyType: {
        type: String,
        required: [true, 'Property type is required'],
        enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'cabin', 'cottage', 'farmhouse', 'loft', 'other']
    },
    roomType: {
        type: String,
        required: [true, 'Room type is required'],
        enum: ['entire_place', 'private_room', 'shared_room']
    },

    // ─── Host ─────────────────────────────────────────────────────
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Host is required']
    },

    // ─── Location ─────────────────────────────────────────────────
    location: {
        address: {
            type: String,
            required: [true, 'Address is required']
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true
        },
        zipCode: {
            type: String,
            trim: true
        },
        // GeoJSON for geospatial queries
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: [true, 'Coordinates are required'],
                validate: {
                    validator: function (v) {
                        return v.length === 2 &&
                            v[0] >= -180 && v[0] <= 180 &&  // longitude
                            v[1] >= -90 && v[1] <= 90;      // latitude
                    },
                    message: 'Invalid coordinates'
                }
            }
        }
    },

    // ─── Images ───────────────────────────────────────────────────
    images: [{
        url: {
            type: String,
            required: true
        },
        thumbnail: String,   // 400x300
        medium: String,      // 800x600
        publicId: String,    // Cloudinary public ID (for deletion)
        caption: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],

    // ─── Pricing ──────────────────────────────────────────────────
    pricing: {
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [1, 'Price must be at least 1']
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD']
        },
        cleaningFee: {
            type: Number,
            default: 0,
            min: 0
        },
        serviceFee: {
            type: Number,
            default: 0,
            min: 0
        },
        securityDeposit: {
            type: Number,
            default: 0,
            min: 0
        },
        weeklyDiscount: {
            type: Number,
            default: 0,
            min: 0,
            max: 80 // max 80% discount
        },
        monthlyDiscount: {
            type: Number,
            default: 0,
            min: 0,
            max: 80
        }
    },

    // ─── Property Details ─────────────────────────────────────────
    details: {
        bedrooms: {
            type: Number,
            required: [true, 'Number of bedrooms is required'],
            min: 0,
            max: 50
        },
        bathrooms: {
            type: Number,
            required: [true, 'Number of bathrooms is required'],
            min: 0,
            max: 50
        },
        beds: {
            type: Number,
            required: [true, 'Number of beds is required'],
            min: 1,
            max: 100
        },
        maxGuests: {
            type: Number,
            required: [true, 'Max guests is required'],
            min: 1,
            max: 100
        },
        squareFeet: {
            type: Number,
            min: 0
        },
        floor: Number,
        totalFloors: Number
    },

    // ─── Amenities ────────────────────────────────────────────────
    amenities: {
        // Essentials
        wifi: { type: Boolean, default: false },
        airConditioning: { type: Boolean, default: false },
        heating: { type: Boolean, default: false },
        kitchen: { type: Boolean, default: false },
        washer: { type: Boolean, default: false },
        dryer: { type: Boolean, default: false },
        // Safety
        smokeDetector: { type: Boolean, default: false },
        carbonMonoxideDetector: { type: Boolean, default: false },
        firstAidKit: { type: Boolean, default: false },
        fireExtinguisher: { type: Boolean, default: false },
        // Outdoor
        freeParking: { type: Boolean, default: false },
        paidParking: { type: Boolean, default: false },
        pool: { type: Boolean, default: false },
        hotTub: { type: Boolean, default: false },
        bbqGrill: { type: Boolean, default: false },
        garden: { type: Boolean, default: false },
        // Entertainment
        tv: { type: Boolean, default: false },
        netflix: { type: Boolean, default: false },
        gym: { type: Boolean, default: false },
        workspace: { type: Boolean, default: false },
        // Accessibility
        elevator: { type: Boolean, default: false },
        wheelchairAccessible: { type: Boolean, default: false },
        // Other
        petsAllowed: { type: Boolean, default: false },
        smokingAllowed: { type: Boolean, default: false },
        eventsAllowed: { type: Boolean, default: false }
    },

    // ─── House Rules ──────────────────────────────────────────────
    houseRules: {
        checkInTime: {
            type: String,
            default: '15:00'  // 3:00 PM
        },
        checkOutTime: {
            type: String,
            default: '11:00'  // 11:00 AM
        },
        minNights: {
            type: Number,
            default: 1,
            min: 1
        },
        maxNights: {
            type: Number,
            default: 365
        },
        additionalRules: [String]
    },

    // ─── Cancellation Policy ──────────────────────────────────────
    cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict'],
        default: 'moderate'
    },

    // ─── Availability Calendar ────────────────────────────────────
    blockedDates: [{
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        reason: { type: String, default: 'blocked' } // 'blocked', 'booked', 'maintenance'
    }],

    // ─── Booking Settings ─────────────────────────────────────────
    instantBooking: {
        type: Boolean,
        default: false
    },

    // ─── Ratings & Reviews ────────────────────────────────────────
    ratings: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
            set: v => Math.round(v * 10) / 10  // round to 1 decimal
        },
        count: {
            type: Number,
            default: 0
        },
        cleanliness: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        location: { type: Number, default: 0 },
        checkIn: { type: Number, default: 0 },
        value: { type: Number, default: 0 }
    },

    // ─── Status ───────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'suspended', 'rejected'],
        default: 'pending'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },

    // ─── Stats ────────────────────────────────────────────────────
    stats: {
        totalBookings: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
        favoriteCount: { type: Number, default: 0 }
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ─── Indexes ────────────────────────────────────────────────────
// 2dsphere index for geospatial queries
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ host: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ 'location.country': 1 });
propertySchema.index({ 'pricing.basePrice': 1 });
propertySchema.index({ 'ratings.average': -1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ isFeatured: 1 });

// ─── Static Method: Find Nearby Properties ───────────────────────
// Usage: Property.findNearby(longitude, latitude, radiusInMeters)
propertySchema.statics.findNearby = function (longitude, latitude, radiusInMeters = 10000) {
    return this.find({
        'location.coordinates': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: radiusInMeters
            }
        },
        status: 'active'
    });
};

// ─── Virtual: Primary Image ──────────────────────────────────────
propertySchema.virtual('primaryImage').get(function () {
    if (!this.images || !this.images.length) return null;  // guard for partial population
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : (this.images[0]?.url || null);
});

// ─── Virtual: Price with Weekly Discount ─────────────────────────
propertySchema.virtual('weeklyPrice').get(function () {
    if (!this.pricing) return null;  // guard for partial population
    const discount = (this.pricing.weeklyDiscount || 0) / 100;
    return Math.round((this.pricing.basePrice || 0) * 7 * (1 - discount));
});

// ─── Virtual: Price with Monthly Discount ────────────────────────
propertySchema.virtual('monthlyPrice').get(function () {
    if (!this.pricing) return null;  // guard for partial population
    const discount = (this.pricing.monthlyDiscount || 0) / 100;
    return Math.round((this.pricing.basePrice || 0) * 30 * (1 - discount));
});

// ─── Method: Check if dates are available ────────────────────────
propertySchema.methods.isAvailable = function (checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    for (const blocked of this.blockedDates) {
        const hasOverlap = checkInDate < blocked.endDate && checkOutDate > blocked.startDate;
        if (hasOverlap) return false;
    }
    return true;
};

module.exports = mongoose.model('Property', propertySchema);
const Review  = require('../models/Review');
const Booking = require('../models/Booking');
const Property = require('../models/Property');

class ReviewService {

  // ─── Create Review ───────────────────────────────────────────────
  static async createReview(guestId, data) {
    const { bookingId, ratings, comment, images } = data;

    // 1. Verify the booking exists and belongs to this guest
    const booking = await Booking.findOne({
      _id:    bookingId,
      guest:  guestId,
      status: 'completed'  // can only review after stay is completed
    });

    if (!booking) {
      throw new Error('You can only review properties after completing your stay');
    }

    // 2. Check if already reviewed this booking
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      throw new Error('You have already reviewed this booking');
    }

    // 3. Create review
    const review = await Review.create({
      property: booking.property,
      guest:    guestId,
      booking:  bookingId,
      ratings,
      comment,
      images:   images || []
    });

    // 4. Mark booking as reviewed
    await Booking.findByIdAndUpdate(bookingId, { hasReview: true });

    return await review.populate([
      { path: 'guest',    select: 'name avatar' },
      { path: 'property', select: 'title location' }
    ]);
  }

  // ─── Get Property Reviews ─────────────────────────────────────────
  static async getPropertyReviews(propertyId, query) {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { property: propertyId };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('guest', 'name avatar')
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(filter)
    ]);

    // Get property rating summary
    const property = await Property.findById(propertyId, 'ratings title');

    return {
      reviews,
      ratingSummary: property?.ratings,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  // ─── Get Single Review ────────────────────────────────────────────
  static async getReviewById(reviewId) {
    const review = await Review.findById(reviewId)
      .populate('guest',    'name avatar')
      .populate('property', 'title location');

    if (!review) throw new Error('Review not found');
    return review;
  }

  // ─── Update Review (guest only, within 48hrs) ─────────────────────
  static async updateReview(reviewId, guestId, data) {
    const review = await Review.findOne({ _id: reviewId, guest: guestId });
    if (!review) throw new Error('Review not found or unauthorized');

    // Only allow edits within 48 hours of posting
    const hoursSincePosted = (Date.now() - review.createdAt) / (1000 * 60 * 60);
    if (hoursSincePosted > 48) {
      throw new Error('Reviews can only be edited within 48 hours of posting');
    }

    const { ratings, comment } = data;
    if (ratings) review.ratings = { ...review.ratings.toObject(), ...ratings };
    if (comment) review.comment = comment;

    await review.save();
    return review;
  }

  // ─── Delete Review (guest only) ───────────────────────────────────
  static async deleteReview(reviewId, guestId) {
    const review = await Review.findOne({ _id: reviewId, guest: guestId });
    if (!review) throw new Error('Review not found or unauthorized');

    await review.deleteOne();

    // Unmark booking
    await Booking.findByIdAndUpdate(review.booking, { hasReview: false });

    return { message: 'Review deleted successfully' };
  }

  // ─── Add Host Response ────────────────────────────────────────────
  static async addHostResponse(reviewId, hostId, comment) {
    // Find review and verify this host owns the property
    const review = await Review.findById(reviewId).populate('property', 'host');
    if (!review) throw new Error('Review not found');

    if (review.property.host.toString() !== hostId.toString()) {
      throw new Error('Not authorized to respond to this review');
    }

    if (review.hostResponse?.comment) {
      throw new Error('You have already responded to this review');
    }

    review.hostResponse = {
      comment,
      respondedAt: new Date()
    };

    await review.save();
    return review;
  }

  // ─── Get Guest Reviews ────────────────────────────────────────────
  static async getGuestReviews(guestId) {
    const reviews = await Review.find({ guest: guestId })
      .populate('property', 'title location images')
      .sort({ createdAt: -1 });
    return reviews;
  }
}

module.exports = ReviewService;
const ReviewService   = require('../services/reviewService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class ReviewController {

  // POST /api/reviews
  static async createReview(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }
      const review = await ReviewService.createReview(req.user.id, req.body);
      return ResponseHandler.success(res, review, 'Review posted successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/reviews/property/:propertyId
  static async getPropertyReviews(req, res) {
    try {
      const result = await ReviewService.getPropertyReviews(req.params.propertyId, req.query);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/reviews/:id
  static async getReview(req, res) {
    try {
      const review = await ReviewService.getReviewById(req.params.id);
      return ResponseHandler.success(res, review);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // PUT /api/reviews/:id
  static async updateReview(req, res) {
    try {
      const review = await ReviewService.updateReview(req.params.id, req.user.id, req.body);
      return ResponseHandler.success(res, review, 'Review updated successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // DELETE /api/reviews/:id
  static async deleteReview(req, res) {
    try {
      const result = await ReviewService.deleteReview(req.params.id, req.user.id);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/reviews/:id/respond
  static async addHostResponse(req, res) {
    try {
      const review = await ReviewService.addHostResponse(req.params.id, req.user.id, req.body.comment);
      return ResponseHandler.success(res, review, 'Response added successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/reviews/my-reviews
  static async getMyReviews(req, res) {
    try {
      const reviews = await ReviewService.getGuestReviews(req.user.id);
      return ResponseHandler.success(res, reviews);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = ReviewController;
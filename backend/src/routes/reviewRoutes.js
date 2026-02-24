const express = require('express');
const ReviewController = require('../controllers/reviewController');
const authMiddleware   = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────
router.get('/property/:propertyId', ReviewController.getPropertyReviews);

// ─── Protected Routes (specific paths BEFORE /:id) ────────────────
router.use(authMiddleware);
router.post('/',                    ReviewController.createReview);
router.get('/guest/my-reviews',     ReviewController.getMyReviews);  // ← must be before /:id
router.put('/:id',                  ReviewController.updateReview);
router.delete('/:id',               ReviewController.deleteReview);
router.post('/:id/respond',         ReviewController.addHostResponse);

// ─── Public /:id LAST (catches all remaining GET /:id) ────────────
router.get('/:id',                  ReviewController.getReview);

module.exports = router;
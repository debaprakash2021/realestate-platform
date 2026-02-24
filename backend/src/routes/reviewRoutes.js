const express = require('express');
const ReviewController = require('../controllers/reviewController');
const authMiddleware   = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────
router.get('/property/:propertyId', ReviewController.getPropertyReviews);
router.get('/:id',                  ReviewController.getReview);

// ─── Protected Routes ─────────────────────────────────────────────
router.use(authMiddleware);
router.post('/',                    ReviewController.createReview);
router.get('/guest/my-reviews',     ReviewController.getMyReviews);
router.put('/:id',                  ReviewController.updateReview);
router.delete('/:id',               ReviewController.deleteReview);
router.post('/:id/respond',         ReviewController.addHostResponse);

module.exports = router;
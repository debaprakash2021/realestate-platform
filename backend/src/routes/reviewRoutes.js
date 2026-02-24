const express = require('express');
const ReviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────
router.get('/property/:propertyId', ReviewController.getPropertyReviews);

// ─── Specific protected route BEFORE /:id ─────────────────────────
router.get('/guest/my-reviews', authMiddleware, ReviewController.getMyReviews);

// ─── Public dynamic route ─────────────────────────────────────────
router.get('/:id', ReviewController.getReview);

// ─── Protected dynamic routes ─────────────────────────────────────
router.use(authMiddleware);
router.post('/',              ReviewController.createReview);
router.put('/:id',            ReviewController.updateReview);
router.delete('/:id',         ReviewController.deleteReview);
router.post('/:id/respond',   ReviewController.addHostResponse);

module.exports = router;
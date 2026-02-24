const express = require('express');
const ReviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────
router.get('/property/:propertyId', ReviewController.getPropertyReviews);

// ─── /guest/my-reviews MUST come before /:id (specific before dynamic) ──
router.get('/guest/my-reviews', authMiddleware, ReviewController.getMyReviews);

// ─── Public single review ─────────────────────────────────────────
router.get('/:id', ReviewController.getReview);

// ─── All remaining protected routes ──────────────────────────────
router.use(authMiddleware);
router.post('/', ReviewController.createReview);
router.put('/:id', ReviewController.updateReview);
router.delete('/:id', ReviewController.deleteReview);
router.post('/:id/respond', ReviewController.addHostResponse);
console.log('✅ reviewRoutes loaded - NEW VERSION');

module.exports = router;

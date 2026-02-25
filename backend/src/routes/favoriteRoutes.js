const express            = require('express');
const FavoriteController = require('../controllers/favoriteController');
const authMiddleware     = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ────────────────────────────────────────────────
router.get('/:propertyId/count', FavoriteController.getFavoriteCount);

// ─── Protected Routes ─────────────────────────────────────────────
router.use(authMiddleware);
router.get('/',                          FavoriteController.getMyFavorites);  // My wishlist
router.post('/:propertyId/toggle',       FavoriteController.toggleFavorite);  // Add/remove
router.get('/:propertyId/check',         FavoriteController.checkFavorite);   // Is favorited?

module.exports = router;
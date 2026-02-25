const FavoriteService = require('../services/favoriteService');
const ResponseHandler = require('../utils/responseHandler');

class FavoriteController {

  // POST /api/favorites/:propertyId/toggle
  static async toggleFavorite(req, res) {
    try {
      const result = await FavoriteService.toggleFavorite(
        req.user.id,
        req.params.propertyId
      );
      return ResponseHandler.success(res, result, result.message);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/favorites
  static async getMyFavorites(req, res) {
    try {
      const favorites = await FavoriteService.getMyFavorites(req.user.id);
      return ResponseHandler.success(res, favorites);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/favorites/:propertyId/check
  static async checkFavorite(req, res) {
    try {
      const result = await FavoriteService.isFavorited(
        req.user.id,
        req.params.propertyId
      );
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/favorites/:propertyId/count
  static async getFavoriteCount(req, res) {
    try {
      const result = await FavoriteService.getFavoriteCount(req.params.propertyId);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }
}

module.exports = FavoriteController;
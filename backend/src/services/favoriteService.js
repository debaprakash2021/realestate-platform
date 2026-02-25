const Favorite = require('../models/Favorite');
const Property = require('../models/Property');

class FavoriteService {

  // ─── Toggle Favorite (add/remove) ────────────────────────────────
  static async toggleFavorite(userId, propertyId) {
    // Check property exists
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    // Check if already favorited
    const existing = await Favorite.findOne({ user: userId, property: propertyId });

    if (existing) {
      // Remove favorite
      await existing.deleteOne();
      // Decrement property favorite count
      await Property.findByIdAndUpdate(propertyId, {
        $inc: { 'stats.favoriteCount': -1 }
      });
      return { action: 'removed', message: 'Removed from favorites' };
    } else {
      // Add favorite
      await Favorite.create({ user: userId, property: propertyId });
      // Increment property favorite count
      await Property.findByIdAndUpdate(propertyId, {
        $inc: { 'stats.favoriteCount': 1 }
      });
      return { action: 'added', message: 'Added to favorites' };
    }
  }

  // ─── Get My Favorites ─────────────────────────────────────────────
  static async getMyFavorites(userId) {
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'property',
        select: 'title location pricing details ratings images status amenities cancellationPolicy instantBooking stats'
      })
      .sort({ createdAt: -1 });

    // Filter out deleted properties
    return favorites.filter(f => f.property !== null);
  }

  // ─── Check if Favorited ───────────────────────────────────────────
  static async isFavorited(userId, propertyId) {
    const favorite = await Favorite.findOne({ user: userId, property: propertyId });
    return { isFavorited: !!favorite };
  }

  // ─── Get Favorite Count for Property ─────────────────────────────
  static async getFavoriteCount(propertyId) {
    const count = await Favorite.countDocuments({ property: propertyId });
    return { propertyId, favoriteCount: count };
  }
}

module.exports = FavoriteService;
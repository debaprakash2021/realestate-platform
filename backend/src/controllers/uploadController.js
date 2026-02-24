const { uploadWithSizes, deleteFromCloudinary } = require('../config/cloudinary');
const Property = require('../models/Property');
const ResponseHandler = require('../utils/responseHandler');

class UploadController {

  // POST /api/upload/property/:id/images
  // Upload multiple images to a property (max 10)
  static async uploadPropertyImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return ResponseHandler.error(res, 'No images provided', 400);
      }

      const property = await Property.findOne({
        _id: req.params.id,
        host: req.user.id
      });

      if (!property) {
        return ResponseHandler.error(res, 'Property not found or unauthorized', 404);
      }

      // Max 10 images per property
      const currentCount = property.images.length;
      if (currentCount + req.files.length > 10) {
        return ResponseHandler.error(
          res,
          `You can only have 10 images per property. Current: ${currentCount}, Trying to add: ${req.files.length}`,
          400
        );
      }

      // Upload all images to Cloudinary
      const uploadPromises = req.files.map(file =>
        uploadWithSizes(file.buffer, `realestate/properties/${property._id}`)
      );
      const uploadedImages = await Promise.all(uploadPromises);

      // First image becomes primary if no images exist yet
      const newImages = uploadedImages.map((img, index) => ({
        url:       img.url,
        thumbnail: img.thumbnail,
        medium:    img.medium,
        publicId:  img.publicId,
        isPrimary: currentCount === 0 && index === 0
      }));

      // Save to property
      property.images.push(...newImages);
      await property.save();

      return ResponseHandler.success(
        res,
        { images: newImages, totalImages: property.images.length },
        `${uploadedImages.length} image(s) uploaded successfully`,
        201
      );
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // DELETE /api/upload/property/:id/images/:publicId
  // Delete a single image from a property
  static async deletePropertyImage(req, res) {
    try {
      const property = await Property.findOne({
        _id: req.params.id,
        host: req.user.id
      });

      if (!property) {
        return ResponseHandler.error(res, 'Property not found or unauthorized', 404);
      }

      const publicId = decodeURIComponent(req.params.publicId);
      const imageIndex = property.images.findIndex(img => img.publicId === publicId);

      if (imageIndex === -1) {
        return ResponseHandler.error(res, 'Image not found', 404);
      }

      const wasPrimary = property.images[imageIndex].isPrimary;

      // Delete from Cloudinary
      await deleteFromCloudinary(publicId);

      // Remove from property
      property.images.splice(imageIndex, 1);

      // If deleted image was primary, make first remaining image primary
      if (wasPrimary && property.images.length > 0) {
        property.images[0].isPrimary = true;
      }

      await property.save();

      return ResponseHandler.success(
        res,
        { totalImages: property.images.length },
        'Image deleted successfully'
      );
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // PUT /api/upload/property/:id/images/:publicId/primary
  // Set an image as the primary/cover image
  static async setPrimaryImage(req, res) {
    try {
      const property = await Property.findOne({
        _id: req.params.id,
        host: req.user.id
      });

      if (!property) {
        return ResponseHandler.error(res, 'Property not found or unauthorized', 404);
      }

      const publicId = decodeURIComponent(req.params.publicId);

      // Unset all primary flags then set the selected one
      property.images = property.images.map(img => ({
        ...img.toObject(),
        isPrimary: img.publicId === publicId
      }));

      await property.save();

      return ResponseHandler.success(res, property.images, 'Primary image updated');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // POST /api/upload/avatar
  // Upload user avatar
  static async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return ResponseHandler.error(res, 'No image provided', 400);
      }

      const User = require('../models/User');
      const user = await User.findById(req.user.id);

      // Delete old avatar from Cloudinary if exists
      if (user.avatar?.publicId) {
        await deleteFromCloudinary(user.avatar.publicId);
      }

      // Upload new avatar
      const result = await uploadWithSizes(req.file.buffer, 'realestate/avatars');

      // Update user
      user.avatar = {
        url:      result.url,
        publicId: result.publicId
      };
      await user.save();

      return ResponseHandler.success(
        res,
        { avatar: user.avatar },
        'Avatar uploaded successfully'
      );
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = UploadController;
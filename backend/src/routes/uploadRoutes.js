const express = require('express');
const UploadController = require('../controllers/uploadController');
const authMiddleware   = require('../middlewares/authMiddleware');
const { upload }       = require('../config/cloudinary');

const router = express.Router();

// All upload routes require login
router.use(authMiddleware);

// ─── Property Image Routes ────────────────────────────────────────
// Upload up to 10 images at once
router.post(
  '/property/:id/images',
  upload.array('images', 10),
  UploadController.uploadPropertyImages
);

// Delete a specific image
router.delete(
  '/property/:id/images/:publicId',
  UploadController.deletePropertyImage
);

// Set primary/cover image
router.put(
  '/property/:id/images/:publicId/primary',
  UploadController.setPrimaryImage
);

// ─── Avatar Route ─────────────────────────────────────────────────
router.post(
  '/avatar',
  upload.single('avatar'),
  UploadController.uploadAvatar
);

module.exports = router;
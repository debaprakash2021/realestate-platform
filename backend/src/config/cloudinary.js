const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// ─── Configure Cloudinary ────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── Multer — Store files in memory before uploading ────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase())
               && allowedTypes.test(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max per image
});

// ─── Upload single image to Cloudinary ──────────────────────────
const uploadToCloudinary = (fileBuffer, folder = 'realestate/properties') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

// ─── Upload image with multiple sizes ───────────────────────────
const uploadWithSizes = async (fileBuffer, folder = 'realestate/properties') => {
  // Upload original first
  const original = await uploadToCloudinary(fileBuffer, folder);

  // Generate thumbnail (400x300) and medium (800x600) using Cloudinary transformations
  const thumbnail = cloudinary.url(original.public_id, {
    width: 400, height: 300, crop: 'fill', quality: 'auto', fetch_format: 'auto'
  });

  const medium = cloudinary.url(original.public_id, {
    width: 800, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto'
  });

  return {
    url:       original.secure_url,
    thumbnail,
    medium,
    publicId:  original.public_id
  };
};

// ─── Delete image from Cloudinary ───────────────────────────────
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  return await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  uploadWithSizes,
  deleteFromCloudinary
};
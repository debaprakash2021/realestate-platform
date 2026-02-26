const { body } = require('express-validator');

// ─── Auth Validation ─────────────────────────────────────────────
const authValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&#^()_\-+=]/).withMessage('Password must contain at least one special character (@$!%*?&#)'),
    body('role')
      .optional()
      .isIn(['guest', 'host']).withMessage('Role must be guest or host')
  ],
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  updateProfile: [
    body('name')
      .optional().trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional().trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('phone')
      .optional().trim()
      .isMobilePhone().withMessage('Please provide a valid phone number'),
    body('bio')
      .optional().trim()
      .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters')
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('New password must contain at least one number')
      .matches(/[@$!%*?&#^()_\-+=]/).withMessage('New password must contain at least one special character (@$!%*?&#)')
  ]
};

// ─── Property Validation ─────────────────────────────────────────
const propertyValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 10, max: 100 }).withMessage('Title must be between 10 and 100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters'),
    body('propertyType')
      .notEmpty().withMessage('Property type is required')
      .isIn(['apartment', 'house', 'villa', 'condo', 'studio', 'cabin', 'cottage', 'farmhouse', 'loft', 'other'])
      .withMessage('Invalid property type'),
    body('roomType')
      .notEmpty().withMessage('Room type is required')
      .isIn(['entire_place', 'private_room', 'shared_room'])
      .withMessage('Invalid room type'),
    body('location.address')
      .notEmpty().withMessage('Address is required'),
    body('location.city')
      .notEmpty().withMessage('City is required'),
    body('location.country')
      .notEmpty().withMessage('Country is required'),
    body('location.coordinates.coordinates')
      .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
    body('pricing.basePrice')
      .notEmpty().withMessage('Base price is required')
      .isNumeric().withMessage('Price must be a number')
      .isFloat({ min: 1 }).withMessage('Price must be at least 1'),
    body('details.bedrooms')
      .notEmpty().withMessage('Number of bedrooms is required')
      .isInt({ min: 0 }).withMessage('Bedrooms must be 0 or more'),
    body('details.bathrooms')
      .notEmpty().withMessage('Number of bathrooms is required')
      .isFloat({ min: 0 }).withMessage('Bathrooms must be 0 or more'),
    body('details.beds')
      .notEmpty().withMessage('Number of beds is required')
      .isInt({ min: 1 }).withMessage('Must have at least 1 bed'),
    body('details.maxGuests')
      .notEmpty().withMessage('Max guests is required')
      .isInt({ min: 1 }).withMessage('Must allow at least 1 guest'),
  ],

  // ─── Property Update Validation ─────────────────────────────────────────
  update: [
    body('title')
      .optional().trim()
      .isLength({ min: 10, max: 100 }).withMessage('Title must be between 10 and 100 characters'),
    body('description')
      .optional().trim()
      .isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters'),
    body('pricing.basePrice')
      .optional()
      .isFloat({ min: 1 }).withMessage('Price must be at least 1'),
    body('status')
      .optional()
      .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
    body('cancellationPolicy')
      .optional()
      .isIn(['flexible', 'moderate', 'strict']).withMessage('Invalid cancellation policy')
  ]
};

// ─── Booking Validation ─────────────────────────────────────────
const bookingValidation = {
  create: [
    body('propertyId')
      .notEmpty().withMessage('Property ID is required')
      .isMongoId().withMessage('Invalid property ID'),
    body('checkIn')
      .notEmpty().withMessage('Check-in date is required')
      .isISO8601().withMessage('Invalid check-in date'),
    body('checkOut')
      .notEmpty().withMessage('Check-out date is required')
      .isISO8601().withMessage('Invalid check-out date'),
    body('guests.adults')
      .optional()
      .isInt({ min: 1 }).withMessage('At least 1 adult required')
  ]
};

module.exports = {
  authValidation,
  propertyValidation,
  bookingValidation
};
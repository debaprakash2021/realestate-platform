const { body } = require('express-validator');

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
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ]
};

const projectValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Project name is required')
      .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('endDate')
      .optional()
      .isISO8601().withMessage('Invalid date format')
  ],
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
  ]
};

const taskValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Task title is required')
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('project')
      .notEmpty().withMessage('Project ID is required')
      .isMongoId().withMessage('Invalid project ID'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid date format')
  ],
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('status')
      .optional()
      .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('assignedTo')
      .optional()
      .isMongoId().withMessage('Invalid user ID')
  ],
  updateStatus: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status')
  ]
};

module.exports = {
  authValidation,
  projectValidation,
  taskValidation
};

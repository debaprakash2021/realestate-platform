const AuthService = require('../services/authService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class AuthController {
  // Register
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const result = await AuthService.register(req.body);
      return ResponseHandler.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return ResponseHandler.success(res, result, 'Login successful');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 401);
    }
  }

  // Get current user
  static async getMe(req, res) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return ResponseHandler.success(res, user);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // Update profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const user = await AuthService.updateProfile(req.user.id, req.body);
      return ResponseHandler.success(res, user, 'Profile updated successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }

      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      return ResponseHandler.success(res, result, 'Password changed successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }
}

module.exports = AuthController;

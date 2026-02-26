const AuthService = require('../services/authService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class AuthController {

  // POST /api/auth/register
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }
      const result = await AuthService.register(req.body);
      return ResponseHandler.success(res, result, result.message, 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/auth/verify-otp
  static async verifyOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return ResponseHandler.error(res, 'Email and OTP are required', 400);
      }
      if (!/^\d{6}$/.test(otp)) {
        return ResponseHandler.error(res, 'OTP must be a 6-digit number', 400);
      }
      const result = await AuthService.verifyOtp(email, otp);
      return ResponseHandler.success(res, result, 'Email verified successfully! Welcome aboard 🎉');
    } catch (error) {
      const statusCode = error.message.includes('expired') || error.message.includes('attempts') ? 410 : 400;
      return ResponseHandler.error(res, error.message, statusCode);
    }
  }

  // POST /api/auth/resend-otp
  static async resendOtp(req, res) {
    try {
      const { email } = req.body;
      if (!email) return ResponseHandler.error(res, 'Email is required', 400);
      const result = await AuthService.resendOtp(email);
      return ResponseHandler.success(res, result, result.message);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/auth/login
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
      // Special case: pass requiresVerification flag to frontend
      if (error.requiresVerification) {
        return res.status(403).json({
          success: false,
          message: error.message,
          requiresVerification: true,
          email: error.email
        });
      }
      return ResponseHandler.error(res, error.message, 401);
    }
  }

  // GET /api/auth/me
  static async getMe(req, res) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return ResponseHandler.success(res, user);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // PUT /api/auth/update-profile
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

  // PUT /api/auth/change-password
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
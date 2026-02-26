const express = require('express');
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authValidation } = require('../middlewares/validation');

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────
router.post('/register',    authValidation.register,       AuthController.register);
router.post('/verify-otp',                                 AuthController.verifyOtp);
router.post('/resend-otp',                                 AuthController.resendOtp);
router.post('/login',       authValidation.login,          AuthController.login);

// ─── Protected ────────────────────────────────────────────────────
router.get('/me',                    authMiddleware, AuthController.getMe);
router.put('/update-profile',        authMiddleware, authValidation.updateProfile, AuthController.updateProfile);
router.put('/change-password',       authMiddleware, authValidation.changePassword, AuthController.changePassword);

module.exports = router;
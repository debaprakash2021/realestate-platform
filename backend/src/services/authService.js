const User    = require('../models/User');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const logger  = require('../utils/logger');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/emailService');

// ─── OTP Config ───────────────────────────────────────────────────
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS   = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const generateOtp = () => {
  // Cryptographically random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

class AuthService {

  // ─── Generate JWT ──────────────────────────────────────────────
  static generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  }

  // ─── Register — creates user (unverified) + sends OTP ─────────
  static async register(userData) {
    try {
      const { name, email, password, role } = userData;

      // Check if email already registered
      const existing = await User.findOne({ email }).select('+emailOtp.lastSentAt +isEmailVerified');
      if (existing) {
        // If registered but unverified → resend OTP instead of erroring
        if (!existing.isEmailVerified) {
          await AuthService.resendOtp(email);
          return {
            requiresVerification: true,
            email,
            message: 'Account already exists but email is not verified. A new OTP has been sent.'
          };
        }
        throw new Error('An account with this email already exists. Please sign in.');
      }

      // Validate role
      const allowedRoles = ['guest', 'host'];
      const userRole = allowedRoles.includes(role) ? role : 'guest';

      // Generate OTP
      const otp       = generateOtp();
      const otpHash   = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Create user — NOT verified yet, no JWT returned
      const user = await User.create({
        name,
        email,
        password,
        role: userRole,
        isEmailVerified: false,
        emailOtp: { code: otpHash, expiresAt, attempts: 0, lastSentAt: new Date() }
      });

      // Send OTP email (throws if SMTP fails)
      await sendOtpEmail(email, name, otp);

      logger.info(`New user registered (pending verification): ${email}`);

      return {
        requiresVerification: true,
        email,
        message: `Verification code sent to ${email}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
      };
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }

  // ─── Verify OTP ────────────────────────────────────────────────
  static async verifyOtp(email, otp) {
    try {
      const user = await User.findOne({ email })
        .select('+emailOtp.code +emailOtp.expiresAt +emailOtp.attempts +isEmailVerified');

      if (!user) throw new Error('No account found with this email.');
      if (user.isEmailVerified) throw new Error('Email is already verified. Please sign in.');

      // Check attempts
      if (user.emailOtp.attempts >= OTP_MAX_ATTEMPTS) {
        throw new Error(`Too many incorrect attempts. Please request a new code.`);
      }

      // Check expiry
      if (!user.emailOtp.expiresAt || new Date() > user.emailOtp.expiresAt) {
        throw new Error('Verification code has expired. Please request a new one.');
      }

      // Compare OTP
      const isMatch = await bcrypt.compare(otp, user.emailOtp.code || '');
      if (!isMatch) {
        // Increment attempt counter
        await User.findByIdAndUpdate(user._id, { $inc: { 'emailOtp.attempts': 1 } });
        const remaining = OTP_MAX_ATTEMPTS - (user.emailOtp.attempts + 1);
        throw new Error(
          remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'Too many incorrect attempts. Please request a new code.'
        );
      }

      // ✅ OTP correct — mark as verified, clear OTP fields
      await User.findByIdAndUpdate(user._id, {
        isEmailVerified: true,
        emailOtp: { code: null, expiresAt: null, attempts: 0, lastSentAt: null }
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, user.name, user.role).catch(() => {});

      const token = this.generateToken(user._id);
      logger.info(`Email verified for user: ${email}`);

      return {
        user: {
          id:     user._id,
          name:   user.name,
          email:  user.email,
          role:   user.role,
          avatar: user.avatar
        },
        token
      };
    } catch (error) {
      logger.error(`OTP verification error: ${error.message}`);
      throw error;
    }
  }

  // ─── Resend OTP ────────────────────────────────────────────────
  static async resendOtp(email) {
    try {
      const user = await User.findOne({ email })
        .select('+emailOtp.lastSentAt +emailOtp.attempts +isEmailVerified +name');

      if (!user)               throw new Error('No account found with this email.');
      if (user.isEmailVerified) throw new Error('Email is already verified. Please sign in.');

      // Enforce cooldown
      if (user.emailOtp?.lastSentAt) {
        const secondsSinceLast = (Date.now() - new Date(user.emailOtp.lastSentAt).getTime()) / 1000;
        if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
          const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
          throw new Error(`Please wait ${wait} seconds before requesting a new code.`);
        }
      }

      // Generate new OTP
      const otp       = generateOtp();
      const otpHash   = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await User.findByIdAndUpdate(user._id, {
        emailOtp: { code: otpHash, expiresAt, attempts: 0, lastSentAt: new Date() }
      });

      await sendOtpEmail(email, user.name, otp);
      logger.info(`OTP resent to: ${email}`);

      return { message: `New verification code sent to ${email}.` };
    } catch (error) {
      logger.error(`Resend OTP error: ${error.message}`);
      throw error;
    }
  }

  // ─── Login ─────────────────────────────────────────────────────
  static async login(email, password) {
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) throw new Error('Invalid email or password.');

      if (!user.isActive) throw new Error('Your account has been deactivated. Contact support.');

      // Block login if email not verified
      if (!user.isEmailVerified) {
        // Auto-resend OTP for convenience
        try { await AuthService.resendOtp(email); } catch (_) {}
        const err = new Error('Email not verified. A new verification code has been sent to your inbox.');
        err.requiresVerification = true;
        err.email = email;
        throw err;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new Error('Invalid email or password.');

      const token = this.generateToken(user._id);
      logger.info(`User logged in: ${email}`);

      return {
        user: {
          id:     user._id,
          name:   user.name,
          email:  user.email,
          role:   user.role,
          avatar: user.avatar
        },
        token
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  // ─── Get current user ──────────────────────────────────────────
  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  // ─── Update profile ────────────────────────────────────────────
  static async updateProfile(userId, updateData) {
    const { name, email, avatar } = updateData;
    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, avatar },
      { new: true, runValidators: true }
    );
    if (!user) throw new Error('User not found');
    logger.info(`Profile updated for user: ${user.email}`);
    return user;
  }

  // ─── Change password ───────────────────────────────────────────
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new Error('Current password is incorrect.');

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    return { message: 'Password updated successfully' };
  }
}

module.exports = AuthService;
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

      const existing = await User.findOne({ email }).select('+emailOtp.lastSentAt +isEmailVerified');
      if (existing) {
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

      const allowedRoles = ['guest', 'host'];
      const userRole = allowedRoles.includes(role) ? role : 'guest';

      const otp       = generateOtp();
      const otpHash   = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const user = await User.create({
        name,
        email,
        password,
        role: userRole,
        isEmailVerified: false,
        emailOtp: { code: otpHash, expiresAt, attempts: 0, lastSentAt: new Date() }
      });

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

      if (user.emailOtp.attempts >= OTP_MAX_ATTEMPTS) {
        throw new Error(`Too many incorrect attempts. Please request a new code.`);
      }

      if (!user.emailOtp.expiresAt || new Date() > user.emailOtp.expiresAt) {
        throw new Error('Verification code has expired. Please request a new one.');
      }

      const isMatch = await bcrypt.compare(otp, user.emailOtp.code || '');
      if (!isMatch) {
        await User.findByIdAndUpdate(user._id, { $inc: { 'emailOtp.attempts': 1 } });
        const remaining = OTP_MAX_ATTEMPTS - (user.emailOtp.attempts + 1);
        throw new Error(
          remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'Too many incorrect attempts. Please request a new code.'
        );
      }

      await User.findByIdAndUpdate(user._id, {
        isEmailVerified: true,
        emailOtp: { code: null, expiresAt: null, attempts: 0, lastSentAt: null }
      });

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

      if (user.emailOtp?.lastSentAt) {
        const secondsSinceLast = (Date.now() - new Date(user.emailOtp.lastSentAt).getTime()) / 1000;
        if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
          const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
          throw new Error(`Please wait ${wait} seconds before requesting a new code.`);
        }
      }

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

      if (!user.isEmailVerified) {
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
          avatar: user.avatar,
          phone:  user.phone,
          bio:    user.bio
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
  // FIX #3: Was only saving { name, email, avatar }.
  // Profile page sends phone and bio too — these were silently dropped,
  // so profile edits appeared to save but vanished on refresh.
  // Also removed email from updatable fields — email changes require
  // re-verification and should not be updated silently.
  static async updateProfile(userId, updateData) {
    const { name, phone, bio, avatar } = updateData;

    const updateFields = {};
    if (name  !== undefined) updateFields.name  = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (bio   !== undefined) updateFields.bio   = bio;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
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
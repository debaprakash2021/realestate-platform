const nodemailer = require('nodemailer');
const logger = require('./logger');

// ─── Create transporter ───────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: { rejectUnauthorized: false }
  });
};

const FROM = `"${process.env.FROM_NAME || 'RealEstate'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;

// ─── Base HTML wrapper ────────────────────────────────────────────
const htmlWrap = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RealEstate</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f43f5e,#e11d48);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;">🏠</span>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">RealEstate</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent by RealEstate Platform. If you didn't request this, you can safely ignore it.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Send OTP Verification Email ──────────────────────────────────
const sendOtpEmail = async (to, name, otp) => {
  const transporter = createTransporter();

  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Verify your email address</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, welcome to RealEstate! Enter the code below to verify your email and activate your account.
    </p>

    <!-- OTP Box -->
    <div style="background:#fff7ed;border:2px dashed #f97316;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your verification code</p>
      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#111827;font-family:monospace;">${otp}</p>
    </div>

    <div style="background:#fef2f2;border-left:4px solid #f43f5e;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#be123c;">
        ⏱ <strong>This code expires in 10 minutes.</strong> Do not share it with anyone.
      </p>
    </div>

    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Didn't create an account? You can safely ignore this email.
    </p>`;

  const mailOptions = {
    from:    FROM,
    to,
    subject: `${otp} — Your RealEstate verification code`,
    html:    htmlWrap(content),
    text:    `Hi ${name},\n\nYour RealEstate verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you didn't create an account, ignore this email.`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${to} — MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}: ${err.message}`);
    throw new Error('Failed to send verification email. Please check your email address and try again.');
  }
};

// ─── Send Welcome Email (after OTP verified) ──────────────────────
const sendWelcomeEmail = async (to, name, role) => {
  const transporter = createTransporter();

  const isHost = role === 'host';
  const content = `
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Welcome to RealEstate, ${name}! 🎉</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Your email has been verified and your account is now active.
      ${isHost
        ? 'Start listing your property and welcoming guests from around the world.'
        : 'Start exploring thousands of unique stays and book your next adventure.'}
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${isHost ? '/host/dashboard' : '/'}"
        style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
        ${isHost ? 'Go to Host Dashboard →' : 'Browse Properties →'}
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you have any questions, just reply to this email.</p>`;

  const mailOptions = {
    from:    FROM,
    to,
    subject: `Welcome to RealEstate, ${name}!`,
    html:    htmlWrap(content),
    text:    `Welcome to RealEstate, ${name}! Your account is now active. Visit ${process.env.CLIENT_URL || 'http://localhost:5173'} to get started.`
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${to}`);
  } catch (err) {
    // Non-critical — don't throw, just log
    logger.warn(`Failed to send welcome email to ${to}: ${err.message}`);
  }
};

module.exports = { sendOtpEmail, sendWelcomeEmail };
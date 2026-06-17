const bcrypt = require("bcryptjs");
const { User, PasswordResetToken, EmailVerificationToken } = require("../models");
const {
  issueTokenPair,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  rotateRefreshToken,
} = require("../utils/authTokens");
const { buildOtpAuthUrl, generateMfaSecret, verifyTotp } = require("../utils/mfa");
const {
  createError,
  normalizeEmail,
  requireFields,
  validatePassword,
} = require("../utils/validators");
const { generateOtp, hashToken } = require("../utils/tokenGenerator");
const { sendMail, isMailConfigured } = require("../services/mailService");
const emailTemplates = require("../templates/emailTemplates");
const config = require("../config/env");

const sanitizeUser = (user) => {
  const data = user.toJSON();
  delete data.password_hash;
  delete data.mfa_secret;
  return data;
};

const register = async (req, res) => {
  requireFields(req.body, ["username", "full_name", "email", "password"]);

  const email = normalizeEmail(req.body.email);
  const username = String(req.body.username).trim().toLowerCase();
  validatePassword(req.body.password);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError("Email is already registered", 409);
  }

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    throw createError("Username is already taken", 409);
  }

  // The very first registered user in the system becomes the admin automatically.
  // This provides a bootstrap mechanism without requiring a separate seed step.
  const userCount = await User.count();
  const role = userCount === 0 ? "admin" : "user";

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    username,
    full_name: String(req.body.full_name).trim(),
    email,
    password_hash: passwordHash,
    role,
  });

  // Send verification email with 6-digit OTP code
  const otpCode = generateOtp();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;
  await EmailVerificationToken.create({
    user_id: user.user_id,
    token_hash: hashToken(otpCode),
    expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
  });

  const template = emailTemplates.emailVerification({
    otpCode,
    userName: user.full_name,
  });
  sendMail({ to: user.email, ...template }).catch(() => {});

  const tokens = await issueTokenPair(user);

  res.status(201).json({
    success: true,
    message: "Account created successfully. Please verify your email.",
    ...tokens,
    data: sanitizeUser(user),
  });
};

const login = async (req, res) => {
  requireFields(req.body, ["identifier", "password"]);

  const identifier = String(req.body.identifier).trim().toLowerCase();
  const isEmail = identifier.includes("@");
  const whereClause = isEmail ? { email: identifier } : { username: identifier };

  const user = await User.scope("withPassword").findOne({ where: whereClause });

  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    throw createError("Invalid credentials", 401);
  }

  if (!user.is_active) {
    throw createError("This account has been disabled", 403);
  }

  if (user.mfa_enabled) {
    if (!req.body.mfa_code) {
      return res.status(401).json({
        success: false,
        message: "Multi-factor authentication code is required",
        mfa_required: true,
      });
    }

    if (!verifyTotp(user.mfa_secret, req.body.mfa_code)) {
      throw createError("Invalid multi-factor authentication code", 401);
    }
  }

  user.last_login = new Date();
  await user.save();

  const tokens = await issueTokenPair(user);

  res.json({
    success: true,
    message: "Login successful",
    ...tokens,
    data: sanitizeUser(user),
  });
};

const refresh = async (req, res) => {
  requireFields(req.body, ["refreshToken"]);

  const tokenPair = await rotateRefreshToken(req.body.refreshToken);
  if (!tokenPair) {
    throw createError("Invalid or expired refresh token", 401);
  }

  res.json({
    success: true,
    message: "Token refreshed successfully",
    token: tokenPair.token,
    refreshToken: tokenPair.refreshToken,
    data: sanitizeUser(tokenPair.user),
  });
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: sanitizeUser(req.user),
  });
};

const logout = async (req, res) => {
  if (req.body && req.body.all_devices) {
    await revokeUserRefreshTokens(req.user.user_id);
  } else if (req.body && req.body.refreshToken) {
    await revokeRefreshToken(req.body.refreshToken);
  }

  res.json({
    success: true,
    message: "Logout successful. Remove the token on the client.",
  });
};

const setupMfa = async (req, res) => {
  const secret = generateMfaSecret();
  const user = await User.scope("withSecurity").findByPk(req.user.user_id);

  user.mfa_secret = secret;
  user.mfa_enabled = false;
  await user.save();

  res.json({
    success: true,
    message: "Scan this secret in an authenticator app, then verify it to enable MFA",
    data: {
      secret,
      otpauth_url: buildOtpAuthUrl(user, secret),
    },
  });
};

const enableMfa = async (req, res) => {
  requireFields(req.body, ["mfa_code"]);

  const user = await User.scope("withSecurity").findByPk(req.user.user_id);
  if (!user.mfa_secret) {
    throw createError("Set up MFA before enabling it", 400);
  }

  if (!verifyTotp(user.mfa_secret, req.body.mfa_code)) {
    throw createError("Invalid multi-factor authentication code", 401);
  }

  user.mfa_enabled = true;
  await user.save();

  // Send MFA enabled alert
  const template = emailTemplates.mfaEnabled({ userName: user.full_name });
  sendMail({ to: user.email, ...template }).catch(() => {});

  res.json({
    success: true,
    message: "Multi-factor authentication enabled",
    data: sanitizeUser(user),
  });
};

const disableMfa = async (req, res) => {
  requireFields(req.body, ["mfa_code"]);

  const user = await User.scope("withSecurity").findByPk(req.user.user_id);
  if (user.mfa_enabled && !verifyTotp(user.mfa_secret, req.body.mfa_code)) {
    throw createError("Invalid multi-factor authentication code", 401);
  }

  user.mfa_enabled = false;
  user.mfa_secret = null;
  await user.save();

  // Send MFA disabled alert
  const template = emailTemplates.mfaDisabled({ userName: user.full_name });
  sendMail({ to: user.email, ...template }).catch(() => {});

  res.json({
    success: true,
    message: "Multi-factor authentication disabled",
    data: sanitizeUser(user),
  });
};

const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = await User.findOne({ where: { email } });

  // Always return success to prevent email enumeration
  if (user) {
    // Invalidate any existing reset tokens for this user
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { user_id: user.user_id, used_at: null } },
    );

    const otpCode = generateOtp();
    const expiryMinutes = config.passwordResetTokenExpiryMinutes || 60;
    await PasswordResetToken.create({
      user_id: user.user_id,
      token_hash: hashToken(otpCode),
      expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    const template = emailTemplates.passwordReset({
      otpCode,
      userName: user.full_name,
    });
    sendMail({ to: user.email, ...template }).catch(() => {});
  }

  res.json({
    success: true,
    message: "If that email is registered, a password reset code has been sent.",
  });
};

const resetPassword = async (req, res) => {
  const { email, otp_code, new_password } = req.body;

  const user = await User.findOne({ where: { email: normalizeEmail(email) } });
  if (!user) {
    throw createError("Invalid or expired reset code", 400);
  }

  // Find all unused reset tokens for this user and check the OTP against them
  const tokens = await PasswordResetToken.findAll({
    where: { user_id: user.user_id, used_at: null },
    order: [["created_at", "DESC"]],
  });

  const resetToken = tokens.find((t) => hashToken(otp_code) === t.token_hash);

  if (!resetToken) {
    throw createError("Invalid or expired reset code", 400);
  }

  if (new Date() > resetToken.expires_at) {
    throw createError("This reset code has expired", 400);
  }

  validatePassword(new_password);
  const passwordHash = await bcrypt.hash(new_password, 12);
  user.password_hash = passwordHash;
  await user.save();

  // Mark token as used
  resetToken.used_at = new Date();
  await resetToken.save();

  // Revoke all refresh tokens (force re-login)
  await revokeUserRefreshTokens(user.user_id);

  // Send confirmation email
  const template = emailTemplates.passwordChanged({ userName: user.full_name });
  sendMail({ to: user.email, ...template }).catch(() => {});

  res.json({
    success: true,
    message: "Password has been reset successfully. Please log in with your new password.",
  });
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  const user = await User.scope("withPassword").findByPk(req.user.user_id);
  if (!user) {
    throw createError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    throw createError("Current password is incorrect", 401);
  }

  validatePassword(new_password);
  user.password_hash = await bcrypt.hash(new_password, 12);
  await user.save();

  // Send confirmation email
  const template = emailTemplates.passwordChanged({ userName: user.full_name });
  sendMail({ to: user.email, ...template }).catch(() => {});

  res.json({
    success: true,
    message: "Password changed successfully.",
  });
};

const verifyEmail = async (req, res) => {
  const { email, otp_code } = req.body;

  const user = await User.findOne({ where: { email: normalizeEmail(email) } });
  if (!user) {
    throw createError("Invalid verification code", 400);
  }

  // Find all unused verification tokens for this user and check the OTP
  const tokens = await EmailVerificationToken.findAll({
    where: { user_id: user.user_id, used_at: null },
    order: [["created_at", "DESC"]],
  });

  const verificationToken = tokens.find((t) => hashToken(otp_code) === t.token_hash);

  if (!verificationToken) {
    throw createError("Invalid verification code", 400);
  }

  if (new Date() > verificationToken.expires_at) {
    throw createError("This verification code has expired", 400);
  }

  user.email_verified = true;
  user.email_verified_at = new Date();
  await user.save();

  verificationToken.used_at = new Date();
  await verificationToken.save();

  res.json({
    success: true,
    message: "Email verified successfully.",
    data: sanitizeUser(user),
  });
};

const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email: normalizeEmail(email) } });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: "If that email is registered, a verification code has been sent.",
    });
  }

  if (user.email_verified) {
    throw createError("Email is already verified", 400);
  }

  // Invalidate existing tokens
  await EmailVerificationToken.update(
    { used_at: new Date() },
    { where: { user_id: user.user_id, used_at: null } },
  );

  const otpCode = generateOtp();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;
  await EmailVerificationToken.create({
    user_id: user.user_id,
    token_hash: hashToken(otpCode),
    expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
  });

  const template = emailTemplates.emailVerification({
    otpCode,
    userName: user.full_name,
  });
  await sendMail({ to: user.email, ...template });

  res.json({
    success: true,
    message: "Verification code has been sent.",
  });
};

module.exports = {
  changePassword,
  disableMfa,
  enableMfa,
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  resetPassword,
  setupMfa,
  verifyEmail,
};

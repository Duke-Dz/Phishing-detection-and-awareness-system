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
const { generateToken, hashToken } = require("../utils/tokenGenerator");
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
  requireFields(req.body, ["full_name", "email", "password"]);

  const email = normalizeEmail(req.body.email);
  validatePassword(req.body.password);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    full_name: String(req.body.full_name).trim(),
    email,
    password_hash: passwordHash,
    role: "user",
  });

  // Send verification email
  const verificationToken = generateToken();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;
  await EmailVerificationToken.create({
    user_id: user.user_id,
    token_hash: hashToken(verificationToken),
    expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
  });

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
  const template = emailTemplates.emailVerification({
    verifyUrl,
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
  requireFields(req.body, ["email", "password"]);

  const email = normalizeEmail(req.body.email);
  const user = await User.scope("withPassword").findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    throw createError("Invalid email or password", 401);
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

    const rawToken = generateToken();
    const expiryMinutes = config.passwordResetTokenExpiryMinutes || 60;
    await PasswordResetToken.create({
      user_id: user.user_id,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;
    const template = emailTemplates.passwordReset({
      resetUrl,
      userName: user.full_name,
    });
    sendMail({ to: user.email, ...template }).catch(() => {});
  }

  res.json({
    success: true,
    message: "If that email is registered, a password reset link has been sent.",
  });
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  const tokenHash = hashToken(token);

  const resetToken = await PasswordResetToken.findOne({
    where: { token_hash: tokenHash },
  });

  if (!resetToken) {
    throw createError("Invalid or expired reset token", 400);
  }

  if (resetToken.used_at) {
    throw createError("This reset token has already been used", 400);
  }

  if (new Date() > resetToken.expires_at) {
    throw createError("This reset token has expired", 400);
  }

  const user = await User.findByPk(resetToken.user_id);
  if (!user) {
    throw createError("User not found", 404);
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
  const { token } = req.body;
  const tokenHash = hashToken(token);

  const verificationToken = await EmailVerificationToken.findOne({
    where: { token_hash: tokenHash },
  });

  if (!verificationToken) {
    throw createError("Invalid verification token", 400);
  }

  if (verificationToken.used_at) {
    throw createError("This token has already been used", 400);
  }

  if (new Date() > verificationToken.expires_at) {
    throw createError("This verification token has expired", 400);
  }

  const user = await User.findByPk(verificationToken.user_id);
  if (!user) {
    throw createError("User not found", 404);
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
  const user = req.user;

  if (user.email_verified) {
    throw createError("Email is already verified", 400);
  }

  // Invalidate existing tokens
  await EmailVerificationToken.update(
    { used_at: new Date() },
    { where: { user_id: user.user_id, used_at: null } },
  );

  const rawToken = generateToken();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;
  await EmailVerificationToken.create({
    user_id: user.user_id,
    token_hash: hashToken(rawToken),
    expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
  });

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${rawToken}`;
  const template = emailTemplates.emailVerification({
    verifyUrl,
    userName: user.full_name,
  });
  await sendMail({ to: user.email, ...template });

  res.json({
    success: true,
    message: "Verification email has been sent.",
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

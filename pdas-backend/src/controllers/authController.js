const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, PasswordResetToken, PendingRegistration, RefreshToken, SecurityEvent } = require("../models");
const { logSecurityEvent } = require("../utils/securityLogger");
const {
  issueTokenPair,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  rotateRefreshToken,
} = require("../utils/authTokens");
const {
  createError,
  normalizeEmail,
  requireFields,
  validatePassword,
} = require("../utils/inputValidation");
const { generateToken, hashToken } = require("../utils/tokenGenerator");
const mailService = require("../services/mailService");
const emailTemplates = require("../templates/emailTemplates");
const config = require("../config/env");
const logger = require("../utils/logger");
const VERIFICATION_RESEND_COOLDOWN_SECONDS = 120;

const sanitizeUser = (user) => {
  const data = user.toJSON();
  delete data.password_hash;
  return data;
};

const notifyOnNewSignIn = async (user, req, historyPromise) => {
  const pastLogins = await historyPromise;

  const currentIp = req.ip || req.connection?.remoteAddress || null;
  const currentUa = req.headers["user-agent"] || null;
  const isKnown = pastLogins.some((event) =>
    event.ip_address === currentIp && event.user_agent === currentUa);

  if (pastLogins.length > 0 && !isKnown) {
    const template = emailTemplates.newSignIn({
      userName: user.full_name,
      ipAddress: currentIp || "Unknown IP",
      userAgent: currentUa || "Unknown Device",
      time: new Date(),
      resetUrl: `${config.frontendUrl.replace(/\/$/, "")}/forgot-password`,
    });
    await mailService.sendMail({ to: user.email, ...template });
  }
};

const register = async (req, res) => {
  requireFields(req.body, ["username", "full_name", "email", "password"]);

  const email = normalizeEmail(req.body.email);
  const username = String(req.body.username).trim().toLowerCase();
  validatePassword(req.body.password);

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError("Email already in use.", 409, "EMAIL_IN_USE");
  }

  const [existingPendingEmail, existingUsername, pendingUsername] = await Promise.all([
    PendingRegistration.findOne({ where: { email } }),
    User.findOne({ where: { username } }),
    PendingRegistration.findOne({ where: { username } }),
  ]);

  if (existingPendingEmail) {
    throw createError(
      "Registration pending. Check your email to verify your account.",
      409,
      "EMAIL_PENDING_VERIFICATION",
    );
  }

  if (existingUsername || pendingUsername) {
    throw createError("Username already taken.", 409, "USERNAME_TAKEN");
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const token = generateToken();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;

  await PendingRegistration.create({
    email,
    username,
    full_name: String(req.body.full_name).trim(),
    password_hash: passwordHash,
    verification_token_hash: hashToken(token),
    expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
  });

  const verificationUrl = `${config.frontendUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  const template = emailTemplates.emailVerification({
    verificationUrl,
    userName: req.body.full_name,
  });
  
  mailService.sendMail({ to: email, ...template }).catch(() => {});

  res.status(201).json({
    success: true,
    message: "Registration pending. Please check your verification email to activate your account.",
    resend_available_in: VERIFICATION_RESEND_COOLDOWN_SECONDS,
  });
};

const login = async (req, res) => {
  requireFields(req.body, ["identifier", "password"]);

  const identifier = String(req.body.identifier).trim().toLowerCase();
  const whereClause = { email: identifier };

  const user = await User.scope("withPassword").findOne({ where: whereClause });
  const genericErrorMsg = "Incorrect email or password.";

  if (!user) {
    throw createError(genericErrorMsg, 401);
  }

  if (!user.is_active) {
    throw createError("This account has been disabled", 403);
  }

  // Check if account is currently locked
  if (user.locked_until && new Date() < user.locked_until) {
    await User.increment('failed_login_attempts', { where: { user_id: user.user_id } });
    await User.update({ last_failed_login: new Date() }, { where: { user_id: user.user_id } });
    throw createError(genericErrorMsg, 401);
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password_hash);

  if (!isMatch) {
    // Increment failed attempts and update last failed login atomically
    await User.increment('failed_login_attempts', { where: { user_id: user.user_id } });
    await User.update({ last_failed_login: new Date() }, { where: { user_id: user.user_id } });

    const updatedUser = await User.findByPk(user.user_id);
    const attempts = updatedUser.failed_login_attempts;

    let lockoutMinutes = 0;
    if (attempts >= 10) {
      lockoutMinutes = 60;
    } else if (attempts >= 5) {
      lockoutMinutes = 15;
    }

    if (lockoutMinutes > 0) {
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      await User.update({ locked_until: lockedUntil }, { where: { user_id: user.user_id } });

      const resetToken = generateToken();
      await PasswordResetToken.create({
        user_id: user.user_id,
        token_hash: hashToken(resetToken),
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      });

      const resetUrl = `${config.frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;
      const template = emailTemplates.accountLocked({
        userName: user.full_name,
        lockoutMinutes,
        resetUrl,
      });

      logSecurityEvent(user.user_id, 'ACCOUNT_LOCKED', req, { lockoutMinutes, attempts });
      mailService.sendMail({ to: user.email, ...template }).catch(() => {});
    } else {
      logSecurityEvent(user.user_id, 'LOGIN_FAILED', req, { reason: 'wrong_password', attempts });
    }

    throw createError(genericErrorMsg, 401);
  }

  user.failed_login_attempts = 0;
  user.locked_until = null;
  user.last_login = new Date();
  await user.save();

  const signInHistoryPromise = SecurityEvent.findAll({
    where: { user_id: user.user_id, event_type: "LOGIN_SUCCESS" },
    order: [["createdAt", "DESC"]],
    limit: 3,
  });
  notifyOnNewSignIn(user, req, signInHistoryPromise).catch((error) => {
    logger.warn("auth.new_sign_in_notification.failed", {
      request_id: req.id,
      error_code: error.original?.code || error.code || error.name,
    });
  });

  logSecurityEvent(user.user_id, 'LOGIN_SUCCESS', req, { method: 'password' });

  const tokens = await issueTokenPair(user, req.body.remember_me === true, req);

  res.json({
    success: true,
    message: "Login successful",
    ...tokens,
    data: sanitizeUser(user),
  });
};

const refresh = async (req, res) => {
  requireFields(req.body, ["refreshToken"]);

  const tokenPair = await rotateRefreshToken(req.body.refreshToken, req);
  
  if (tokenPair && tokenPair.error === 'ReplayDetected') {
    throw createError("Token replay detected. All sessions revoked for security.", 401);
  }

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

  logSecurityEvent(req.user.user_id, 'LOGOUT', req);

  res.json({
    success: true,
    message: "Logout successful. Remove the token on the client.",
  });
};

const forgotPassword = async (req, res) => {
  const requestStartedAt = Date.now();
  const email = normalizeEmail(req.body.email);
  const user = await User.findOne({ where: { email } });

  // Always return success to prevent email enumeration
  if (user) {
    // Invalidate any existing reset tokens for this user
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { user_id: user.user_id, used_at: null } },
    );

    const resetToken = generateToken();
    const expiryMinutes = config.passwordResetTokenExpiryMinutes || 60;
    await PasswordResetToken.create({
      user_id: user.user_id,
      token_hash: hashToken(resetToken),
      expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    const resetUrl = `${config.frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const template = emailTemplates.passwordReset({
      resetUrl,
      userName: user.full_name,
      expiryMinutes,
    });

    logSecurityEvent(user.user_id, 'PASSWORD_RESET_REQUESTED', req);

    mailService.sendMail({ to: user.email, ...template }).catch((error) => {
      logger.warn("password_reset.delivery_failed", {
        user_id: user.user_id,
        recipient_domain: user.email.split("@")[1] || "invalid",
        error,
      });
    });
  }

  const remainingDelay = config.passwordResetResponseDelayMs - (Date.now() - requestStartedAt);
  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }

  res.json({
    success: true,
    message: "If that email is registered, a password reset link has been sent.",
    resend_available_in: 60,
  });
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  const resetToken = await PasswordResetToken.findOne({
    where: { token_hash: hashToken(token), used_at: null },
  });
  if (!resetToken) {
    throw createError("Invalid or expired reset link", 400);
  }

  if (new Date() > resetToken.expires_at) {
    throw createError("This reset link has expired", 400);
  }

  const user = await User.scope("withPassword").findByPk(resetToken.user_id);
  if (!user) {
    throw createError("Invalid or expired reset link", 400);
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

  logSecurityEvent(user.user_id, 'PASSWORD_RESET_COMPLETED', req);

  // Send confirmation email
  const template = emailTemplates.passwordChanged({ userName: user.full_name });
  mailService.sendMail({ to: user.email, ...template }).catch(() => {});

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

  logSecurityEvent(req.user.user_id, 'PASSWORD_CHANGED', req);

  // Send confirmation email
  const template = emailTemplates.passwordChanged({ userName: user.full_name });
  mailService.sendMail({ to: user.email, ...template }).catch(() => {});

  res.json({
    success: true,
    message: "Password changed successfully.",
  });
};

const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError("Verification token is missing", 400);
  }

  const pendingReg = await PendingRegistration.findOne({
    where: { verification_token_hash: hashToken(token) },
  });

  if (!pendingReg) {
    throw createError("Invalid verification link", 400);
  }

  if (new Date() > pendingReg.expires_at) {
    await pendingReg.destroy();
    throw createError("This verification link has expired. Please register again.", 400);
  }

  // The very first registered user in the system becomes the admin automatically.
  const userCount = await User.count();
  const role = userCount === 0 ? "admin" : "user";

  const user = await User.create({
    username: pendingReg.username,
    full_name: pendingReg.full_name,
    email: pendingReg.email,
    password_hash: pendingReg.password_hash,
    role,
    email_verified: true,
    email_verified_at: new Date(),
    is_active: true,
  });

  await pendingReg.destroy();

  logSecurityEvent(user.user_id, 'EMAIL_VERIFIED', req);
  logSecurityEvent(user.user_id, 'ACCOUNT_REGISTERED', req);

  res.json({
    success: true,
    message: "Email verified successfully. You may now log in.",
    data: sanitizeUser(user),
  });
};

const resendVerification = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const pendingReg = await PendingRegistration.findOne({ where: { email } });

  // Always return success to prevent email enumeration
  if (!pendingReg) {
    const user = await User.findOne({ where: { email } });
    if (user) {
      throw createError("Account is already verified. Please log in.", 400);
    }
    return res.json({
      success: true,
      message: "If that email is registered, a verification link has been sent.",
    });
  }

  const lastSentAt = pendingReg.updated_at || pendingReg.created_at;
  const elapsedMs = lastSentAt ? Date.now() - new Date(lastSentAt).getTime() : Number.POSITIVE_INFINITY;
  const cooldownMs = VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000;
  if (elapsedMs < cooldownMs) {
    const retryAfterSeconds = Math.max(1, Math.ceil((cooldownMs - elapsedMs) / 1000));
    const error = createError(
      `Please wait ${retryAfterSeconds} seconds before requesting another verification email.`,
      429,
      "VERIFICATION_RESEND_COOLDOWN",
    );
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }

  const token = generateToken();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;

  const verificationUrl = `${config.frontendUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  const template = emailTemplates.emailVerification({
    verificationUrl,
    userName: pendingReg.full_name,
  });
  try {
    const delivery = await mailService.sendMail({ to: pendingReg.email, ...template });
    if (!delivery && mailService.isMailConfigured()) {
      throw new Error("Email delivery did not return a receipt");
    }
    if (!delivery && !mailService.isMailConfigured()) {
      throw createError(
        "Email delivery is not configured. Please contact the system administrator.",
        503,
        "EMAIL_DELIVERY_UNAVAILABLE",
      );
    }
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError(
      "We could not send the verification email right now. Please try again in a few minutes.",
      503,
      "EMAIL_DELIVERY_UNAVAILABLE",
    );
  }

  pendingReg.verification_token_hash = hashToken(token);
  pendingReg.expires_at = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  await pendingReg.save();

  res.json({
    success: true,
    message: "Verification link has been resent.",
    resend_available_in: VERIFICATION_RESEND_COOLDOWN_SECONDS,
  });
};

const getSessions = async (req, res) => {
  const sessions = await RefreshToken.findAll({
    where: {
      user_id: req.user.user_id,
      revoked_at: null,
      expires_at: { [Op.gt]: new Date() }
    },
    order: [['last_used_at', 'DESC']]
  });

  const currentIp = req.ip || req.connection?.remoteAddress || null;
  const currentUa = req.headers['user-agent'] || null;

  const sessionData = sessions.map(s => ({
    id: s.refresh_token_id,
    user_agent: s.user_agent,
    ip_address: s.ip_address,
    last_used_at: s.last_used_at || s.created_at,
    created_at: s.created_at,
    is_current: (s.ip_address === currentIp && s.user_agent === currentUa)
  }));

  res.json({
    success: true,
    data: sessionData
  });
};

const revokeSession = async (req, res) => {
  const session = await RefreshToken.findOne({
    where: {
      refresh_token_id: req.params.id,
      user_id: req.user.user_id
    }
  });

  if (!session) {
    throw createError("You do not have permission to revoke this session.", 403);
  }

  session.revoked_at = new Date();
  await session.save();

  res.json({
    success: true,
    message: "Session revoked successfully"
  });
};

module.exports = {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
  getSessions,
  revokeSession,
};

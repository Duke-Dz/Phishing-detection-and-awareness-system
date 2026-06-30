const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, PasswordResetToken, EmailVerificationToken, PendingRegistration, RefreshToken, SecurityEvent } = require("../models");
const { logSecurityEvent } = require("../utils/securityLogger");
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
const { generateOtp, generateToken, hashToken } = require("../utils/tokenGenerator");
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

  // Delete any existing pending registration for this email
  await PendingRegistration.destroy({ where: { email } });

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
  
  sendMail({ to: email, ...template }).catch(() => {});

  res.status(201).json({
    success: true,
    message: "Registration pending. Please check your email to verify your account.",
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
      sendMail({ to: user.email, ...template }).catch(err => console.error('[AccountLocked Email Error]:', err));
    } else {
      logSecurityEvent(user.user_id, 'LOGIN_FAILED', req, { reason: 'wrong_password', attempts });
    }

    throw createError(genericErrorMsg, 401);
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
      logSecurityEvent(user.user_id, 'LOGIN_FAILED', req, { reason: 'invalid_mfa' });
      throw createError(genericErrorMsg, 401);
    }
  }

  user.failed_login_attempts = 0;
  user.locked_until = null;
  user.last_login = new Date();
  await user.save();

  const pastLogins = await SecurityEvent.findAll({
    where: { user_id: user.user_id, event_type: 'LOGIN_SUCCESS' },
    order: [['created_at', 'DESC']],
    limit: 3
  });

  const currentIp = req.ip || req.connection?.remoteAddress || null;
  const currentUa = req.headers['user-agent'] || null;

  if (pastLogins.length > 0) {
    const isKnown = pastLogins.some(log => log.ip_address === currentIp && log.user_agent === currentUa);
    if (!isKnown) {
      const resetUrl = `${config.frontendUrl.replace(/\/$/, "")}/forgot-password`;
      
      const template = emailTemplates.newSignIn({
        userName: user.full_name,
        ipAddress: currentIp || 'Unknown IP',
        userAgent: currentUa || 'Unknown Device',
        time: new Date(),
        resetUrl
      });
      sendMail({ to: user.email, ...template }).catch(err => console.error('[NewSignIn Email Error]:', err));
    }
  }

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

    sendMail({ to: user.email, ...template }).catch(() => {});
  }

  res.json({
    success: true,
    message: "If that email is registered, a password reset link has been sent.",
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

  logSecurityEvent(req.user.user_id, 'PASSWORD_CHANGED', req);

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

  const token = generateToken();
  const expiryHours = config.emailVerificationTokenExpiryHours || 24;

  pendingReg.verification_token_hash = hashToken(token);
  pendingReg.expires_at = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  await pendingReg.save();

  const verificationUrl = `${config.frontendUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
  const template = emailTemplates.emailVerification({
    verificationUrl,
    userName: pendingReg.full_name,
  });
  await sendMail({ to: pendingReg.email, ...template });

  res.json({
    success: true,
    message: "Verification link has been resent.",
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
  getSessions,
  revokeSession,
};

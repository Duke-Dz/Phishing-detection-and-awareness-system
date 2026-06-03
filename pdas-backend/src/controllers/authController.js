const bcrypt = require("bcryptjs");
const { User } = require("../models");
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
  const userCount = await User.count();
  const user = await User.create({
    full_name: String(req.body.full_name).trim(),
    email,
    password_hash: passwordHash,
    role: userCount === 0 ? "admin" : "user",
  });

  const tokens = await issueTokenPair(user);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
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

module.exports = {
  disableMfa,
  enableMfa,
  getMe,
  login,
  logout,
  refresh,
  register,
  setupMfa,
};

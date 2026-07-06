const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../config/sequelize");
const config = require("../config/env");
const { RefreshToken, User } = require("../models");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const sessionPolicies = {
  normal: {
    idleMs: config.auth.normalSessionIdleMinutes * 60 * 1000,
    absoluteMs: config.auth.normalSessionAbsoluteHours * 60 * 60 * 1000,
  },
  remember: {
    idleMs: config.auth.rememberMeIdleDays * 24 * 60 * 60 * 1000,
    absoluteMs: config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  },
};

const getSessionPolicy = (rememberMe = false) =>
  rememberMe ? sessionPolicies.remember : sessionPolicies.normal;

const getRefreshExpiry = (rememberMe = false, now = new Date()) =>
  new Date(now.getTime() + getSessionPolicy(rememberMe).absoluteMs);

const getRequestMetadata = (req, now = new Date()) => ({
  ip_address: req?.ip || req?.connection?.remoteAddress || null,
  user_agent: req?.headers?.["user-agent"] || null,
  last_used_at: now,
});

const signAccessToken = (user) =>
  jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );

const issueRefreshToken = async (user, rememberMe = false, req = null) => {
  const now = new Date();
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const record = await RefreshToken.create({
    user_id: user.user_id,
    token_hash: hashToken(refreshToken),
    expires_at: getRefreshExpiry(rememberMe, now),
    remember_me: rememberMe,
    ...getRequestMetadata(req, now),
  });

  return { refreshToken, refreshTokenRecord: record };
};

const issueTokenPair = async (user, rememberMe = false, req = null) => {
  const refresh = await issueRefreshToken(user, rememberMe, req);
  return {
    token: signAccessToken(user),
    ...refresh,
  };
};

const isIdleExpired = (tokenRecord, now = new Date()) => {
  const rememberMe = tokenRecord.remember_me === true;
  const policy = getSessionPolicy(rememberMe);
  const lastUsedAt = tokenRecord.last_used_at || tokenRecord.created_at;
  if (!lastUsedAt) return false;
  return now.getTime() - new Date(lastUsedAt).getTime() > policy.idleMs;
};

const rotateRefreshToken = async (refreshToken, req = null) => {
  const tokenHash = hashToken(refreshToken);
  const existingToken = await RefreshToken.findOne({
    where: { token_hash: tokenHash },
    include: [{ model: User, as: "user" }],
  });

  if (!existingToken) {
    return null;
  }

  if (existingToken.revoked_at !== null || existingToken.replaced_by_hash !== null) {
    await revokeUserRefreshTokens(existingToken.user_id);
    const { logSecurityEvent } = require("./securityLogger");
    logSecurityEvent(existingToken.user_id, "TOKEN_REPLAY_DETECTED", req, { tokenHash });
    return { error: "ReplayDetected" };
  }

  const now = new Date();
  if (
    existingToken.expires_at <= now ||
    isIdleExpired(existingToken, now) ||
    !existingToken.user ||
    !existingToken.user.is_active
  ) {
    existingToken.revoked_at = now;
    existingToken.last_used_at = now;
    await existingToken.save();
    return null;
  }

  return sequelize.transaction(async (transaction) => {
    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newHash = hashToken(newRefreshToken);
    const rememberMe = existingToken.remember_me === true;

    existingToken.last_used_at = now;
    existingToken.revoked_at = now;
    existingToken.replaced_by_hash = newHash;
    await existingToken.save({ transaction });

    const refreshTokenRecord = await RefreshToken.create({
      user_id: existingToken.user_id,
      token_hash: newHash,
      expires_at: existingToken.expires_at,
      remember_me: rememberMe,
      ...getRequestMetadata(req, now),
    }, { transaction });

    return {
      user: existingToken.user,
      token: signAccessToken(existingToken.user),
      refreshToken: newRefreshToken,
      refreshTokenRecord,
    };
  });
};

const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    return 0;
  }

  const [count] = await RefreshToken.update(
    { revoked_at: new Date() },
    {
      where: {
        token_hash: hashToken(refreshToken),
        revoked_at: null,
      },
    },
  );

  return count;
};

const revokeUserRefreshTokens = async (userId) => {
  const [count] = await RefreshToken.update(
    { revoked_at: new Date() },
    {
      where: {
        user_id: userId,
        revoked_at: null,
      },
    },
  );

  return count;
};

module.exports = {
  getSessionPolicy,
  issueRefreshToken,
  issueTokenPair,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  rotateRefreshToken,
  signAccessToken,
};

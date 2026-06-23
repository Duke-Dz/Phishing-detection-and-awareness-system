const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { RefreshToken, User } = require("../models");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getRefreshExpiry = (rememberMe = false) => {
  const days = rememberMe ? Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) : 1;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

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
  const refreshToken = crypto.randomBytes(64).toString("hex");

  const metadata = {};
  if (req) {
    metadata.ip_address = req.ip || req.connection?.remoteAddress || null;
    metadata.user_agent = req.headers['user-agent'] || null;
    metadata.last_used_at = new Date();
  }

  await RefreshToken.create({
    user_id: user.user_id,
    token_hash: hashToken(refreshToken),
    expires_at: getRefreshExpiry(rememberMe),
    ...metadata
  });

  return refreshToken;
};

const issueTokenPair = async (user, rememberMe = false, req = null) => ({
  token: signAccessToken(user),
  refreshToken: await issueRefreshToken(user, rememberMe, req),
});

const { sequelize } = require("../config/sequelize");

const rotateRefreshToken = async (refreshToken, req = null) => {
  const tokenHash = hashToken(refreshToken);
  
  const existingToken = await RefreshToken.findOne({
    where: { token_hash: tokenHash },
    include: [{ model: User, as: "user" }],
  });

  if (!existingToken) {
    return null;
  }

  // Replay detection
  if (existingToken.revoked_at !== null || existingToken.replaced_by_hash !== null) {
    await revokeUserRefreshTokens(existingToken.user_id);
    const { logSecurityEvent } = require("./securityLogger");
    logSecurityEvent(existingToken.user_id, 'TOKEN_REPLAY_DETECTED', req, { tokenHash });
    return { error: 'ReplayDetected' };
  }

  if (existingToken.expires_at <= new Date() || !existingToken.user || !existingToken.user.is_active) {
    return null;
  }

  // Inherit remember_me: calculate duration between created_at and expires_at
  const originalDurationMs = existingToken.expires_at.getTime() - existingToken.created_at.getTime();
  const originalDays = Math.round(originalDurationMs / (24 * 60 * 60 * 1000));
  const isRememberMe = originalDays > 1;

  return await sequelize.transaction(async (t) => {
    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    
    // Update last_used_at on the old token (to signify it was successfully used for rotation right now)
    existingToken.last_used_at = new Date();
    existingToken.revoked_at = new Date();
    existingToken.replaced_by_hash = hashToken(newRefreshToken);
    await existingToken.save({ transaction: t });

    const metadata = {};
    if (req) {
      metadata.ip_address = req.ip || req.connection?.remoteAddress || null;
      metadata.user_agent = req.headers['user-agent'] || null;
      metadata.last_used_at = new Date();
    }

    await RefreshToken.create({
      user_id: existingToken.user_id,
      token_hash: existingToken.replaced_by_hash,
      expires_at: getRefreshExpiry(isRememberMe),
      ...metadata
    }, { transaction: t });

    return {
      user: existingToken.user,
      token: signAccessToken(existingToken.user),
      refreshToken: newRefreshToken,
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
  issueTokenPair,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  rotateRefreshToken,
  signAccessToken,
};

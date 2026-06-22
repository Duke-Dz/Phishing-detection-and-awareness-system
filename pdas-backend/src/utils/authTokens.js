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

const issueRefreshToken = async (user, rememberMe = false) => {
  const refreshToken = crypto.randomBytes(64).toString("hex");

  await RefreshToken.create({
    user_id: user.user_id,
    token_hash: hashToken(refreshToken),
    expires_at: getRefreshExpiry(rememberMe),
  });

  return refreshToken;
};

const issueTokenPair = async (user, rememberMe = false) => ({
  token: signAccessToken(user),
  refreshToken: await issueRefreshToken(user, rememberMe),
});

const rotateRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
    include: [{ model: User, as: "user" }],
  });

  if (!storedToken || !storedToken.user || !storedToken.user.is_active) {
    return null;
  }

  const newRefreshToken = crypto.randomBytes(64).toString("hex");
  storedToken.revoked_at = new Date();
  storedToken.replaced_by_hash = hashToken(newRefreshToken);
  await storedToken.save();

  await RefreshToken.create({
    user_id: storedToken.user_id,
    token_hash: storedToken.replaced_by_hash,
    expires_at: getRefreshExpiry(),
  });

  return {
    user: storedToken.user,
    token: signAccessToken(storedToken.user),
    refreshToken: newRefreshToken,
  };
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

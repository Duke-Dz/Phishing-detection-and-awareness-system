const jwt = require("jsonwebtoken");
const { User } = require("../models");

// ── In-memory user cache (60-second TTL) ─────────────────────────────────────
const userCache = new Map();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 seconds

const protect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      const error = new Error("Authentication token is required");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user cache first
    const cached = userCache.get(decoded.user_id);
    if (cached && cached.expires > Date.now()) {
      req.user = cached.user;
      return next();
    }

    const user = await User.findByPk(decoded.user_id);

    if (!user || !user.is_active) {
      const error = new Error("User account is not active");
      error.statusCode = 401;
      throw error;
    }

    // Store in cache
    userCache.set(decoded.user_id, {
      user,
      expires: Date.now() + USER_CACHE_TTL_MS,
    });

    req.user = user;
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    error.message = error.name === "JsonWebTokenError" ? "Invalid token" : error.message;
    next(error);
  }
};

const clearUserCache = (userId) => {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
};

module.exports = { protect, clearUserCache };

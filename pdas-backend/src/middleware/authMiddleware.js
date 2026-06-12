const jwt = require("jsonwebtoken");
const { User } = require("../models");

<<<<<<< HEAD
// ── In-memory user cache (60-second TTL) ─────────────────────────────────────
const userCache = new Map();
const USER_CACHE_TTL_MS = 60 * 1000; // 60 seconds

=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
<<<<<<< HEAD

    // Check user cache first
    const cached = userCache.get(decoded.user_id);
    if (cached && cached.expires > Date.now()) {
      req.user = cached.user;
      return next();
    }

=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
    const user = await User.findByPk(decoded.user_id);

    if (!user || !user.is_active) {
      const error = new Error("User account is not active");
      error.statusCode = 401;
      throw error;
    }

<<<<<<< HEAD
    // Store in cache
    userCache.set(decoded.user_id, {
      user,
      expires: Date.now() + USER_CACHE_TTL_MS,
    });

=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
    req.user = user;
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    error.message = error.name === "JsonWebTokenError" ? "Invalid token" : error.message;
    next(error);
  }
};

<<<<<<< HEAD
const clearUserCache = (userId) => {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
};

module.exports = { protect, clearUserCache };
=======
module.exports = { protect };
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

const jwt = require("jsonwebtoken");
const { User } = require("../models");
const config = require("../config/env");
const cacheService = require("../services/cacheService");

const protect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      const error = new Error("Authentication token is required");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await cacheService.getOrSet(
      cacheService.keys.userSession(decoded.user_id),
      () => User.findByPk(decoded.user_id),
      60,
    );
    if (!user || !user.is_active) {
      cacheService.del(cacheService.keys.userSession(decoded.user_id));
      const error = new Error("User account is not active");
      error.statusCode = 401;
      throw error;
    }
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
    cacheService.del(cacheService.keys.userSession(userId));
  }
};

module.exports = { protect, clearUserCache };

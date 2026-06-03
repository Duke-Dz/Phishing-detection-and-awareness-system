const jwt = require("jsonwebtoken");
const { User } = require("../models");

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
    const user = await User.findByPk(decoded.user_id);

    if (!user || !user.is_active) {
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

module.exports = { protect };

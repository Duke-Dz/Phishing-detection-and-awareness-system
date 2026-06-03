const validator = require("validator");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requireFields = (body, fields) => {
  const missing = fields.filter((field) => !body[field]);
  if (missing.length) {
    throw createError(`Missing required field(s): ${missing.join(", ")}`);
  }
};

const normalizeEmail = (email) => {
  const normalized = validator.normalizeEmail(String(email || "").trim());
  if (!normalized || !validator.isEmail(normalized)) {
    throw createError("A valid email address is required");
  }
  return normalized;
};

const validatePassword = (password) => {
  if (String(password || "").length < 8) {
    throw createError("Password must be at least 8 characters long");
  }
};

const validateUrl = (url) => {
  const value = String(url || "").trim();
  if (
    !validator.isURL(value, {
      require_protocol: true,
      protocols: ["http", "https"],
    })
  ) {
    throw createError("A valid URL with http:// or https:// is required");
  }
  return value;
};

module.exports = {
  createError,
  requireFields,
  normalizeEmail,
  validatePassword,
  validateUrl,
};

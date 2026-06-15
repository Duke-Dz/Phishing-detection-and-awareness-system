const { body } = require("express-validator");

const updateUserValidator = [
  body("role")
    .optional()
    .isIn(["user", "analyst", "admin"])
    .withMessage("Role must be user, analyst, or admin"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean")
    .toBoolean(),
];

const createThreatIntelValidator = [
  body("domain")
    .trim()
    .notEmpty()
    .withMessage("Domain is required")
    .isLength({ max: 255 })
    .withMessage("Domain is too long")
    .isFQDN()
    .withMessage("Please provide a valid domain name"),

  body("reputation_score")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Reputation score must be between 0 and 100")
    .toFloat(),

  body("is_blacklisted")
    .optional()
    .isBoolean()
    .withMessage("is_blacklisted must be a boolean")
    .toBoolean(),

  body("threat_type")
    .optional()
    .isIn(["phishing", "malware", "spam", "unknown"])
    .withMessage("Invalid threat type"),

  body("blacklist_sources")
    .optional()
    .isArray()
    .withMessage("blacklist_sources must be an array"),
];

const updateThreatIntelValidator = [
  body("domain")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Domain is too long")
    .isFQDN()
    .withMessage("Please provide a valid domain name"),

  body("reputation_score")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Reputation score must be between 0 and 100")
    .toFloat(),

  body("is_blacklisted")
    .optional()
    .isBoolean()
    .withMessage("is_blacklisted must be a boolean")
    .toBoolean(),

  body("threat_type")
    .optional()
    .isIn(["phishing", "malware", "spam", "unknown"])
    .withMessage("Invalid threat type"),

  body("blacklist_sources")
    .optional()
    .isArray()
    .withMessage("blacklist_sources must be an array"),
];

module.exports = { updateUserValidator, createThreatIntelValidator, updateThreatIntelValidator };

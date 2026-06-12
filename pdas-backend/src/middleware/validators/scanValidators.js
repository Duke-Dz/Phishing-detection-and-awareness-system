const { body } = require("express-validator");

const urlScanValidator = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("URL is required")
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
      require_tld: true,
    })
    .withMessage("Please provide a valid URL including http:// or https://")
    .isLength({ max: 2048 })
    .withMessage("URL is too long")
    .custom((value) => {
      // Block private/internal IPs being scanned
      const privatePatterns = [
        /^https?:\/\/localhost/i,
        /^https?:\/\/127\./,
        /^https?:\/\/192\.168\./,
        /^https?:\/\/10\./,
        /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^https?:\/\/0\.0\.0\.0/,
        /^https?:\/\/\[::1\]/,
      ];
      if (privatePatterns.some((pattern) => pattern.test(value))) {
        throw new Error("Scanning internal or private network addresses is not allowed");
      }
      return true;
    }),
];

const contentScanValidator = [
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 1, max: 50000 })
    .withMessage("Content must be between 1 and 50,000 characters"),
  body("sender")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Sender must be under 50 characters"),
];

module.exports = { urlScanValidator, contentScanValidator };

const { body } = require("express-validator");

const createReportValidator = [
  body("report_type")
    .notEmpty()
    .withMessage("Report type is required")
    .isIn(["url", "email", "sms"])
    .withMessage("Report type must be url, email, or sms"),

  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ max: 50000 })
    .withMessage("Content is too long"),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .isLength({ max: 5000 })
    .withMessage("Notes too long"),
];

const updateReportStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "under_review", "confirmed", "false_positive"])
    .withMessage("Invalid report status"),
];

module.exports = { createReportValidator, updateReportStatusValidator };

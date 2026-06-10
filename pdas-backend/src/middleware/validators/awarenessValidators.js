const { body } = require("express-validator");

const createAwarenessValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title is too long"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["email", "url", "sms", "social", "advanced", "security"])
    .withMessage("Invalid category"),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),

  body("body")
    .optional()
    .isString()
    .withMessage("Body must be a string"),

  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),

  body("duration_minutes")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),

  body("is_published")
    .optional()
    .isBoolean()
    .withMessage("is_published must be a boolean"),
];

const updateAwarenessValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title is too long"),

  body("category")
    .optional()
    .isIn(["email", "url", "sms", "social", "advanced", "security"])
    .withMessage("Invalid category"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("body")
    .optional()
    .isString()
    .withMessage("Body must be a string"),

  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),

  body("duration_minutes")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("Duration must be between 1 and 480 minutes"),

  body("is_published")
    .optional()
    .isBoolean()
    .withMessage("is_published must be a boolean"),
];

module.exports = { createAwarenessValidator, updateAwarenessValidator };

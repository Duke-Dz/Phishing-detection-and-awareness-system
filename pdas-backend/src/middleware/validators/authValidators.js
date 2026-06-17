const { body } = require("express-validator");

const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'\-]+$/)
    .withMessage("Full name can only contain letters, spaces, hyphens, and apostrophes"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email is too long"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isLength({ max: 128 })
    .withMessage("Password is too long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
];

const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email or username is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

const refreshValidator = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isString()
    .withMessage("Refresh token must be a string"),
];

const mfaCodeValidator = [
  body("mfa_code")
    .notEmpty()
    .withMessage("MFA code is required")
    .isString()
    .withMessage("MFA code must be a string")
    .isLength({ min: 6, max: 6 })
    .withMessage("MFA code must be 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("MFA code must contain only digits"),
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("otp_code")
    .notEmpty()
    .withMessage("Verification code is required")
    .isString()
    .withMessage("Verification code must be a string")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("Verification code must contain only digits"),

  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isLength({ max: 128 })
    .withMessage("Password is too long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  body("confirm_password")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

const changePasswordValidator = [
  body("current_password")
    .notEmpty()
    .withMessage("Current password is required"),

  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isLength({ max: 128 })
    .withMessage("Password is too long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  body("confirm_password")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

const verifyEmailValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("otp_code")
    .notEmpty()
    .withMessage("Verification code is required")
    .isString()
    .withMessage("Verification code must be a string")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("Verification code must contain only digits"),
];

const resendVerificationValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
  mfaCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
};

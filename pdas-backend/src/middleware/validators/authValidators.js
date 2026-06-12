const { body } = require("express-validator");

const registerValidator = [
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
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

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

<<<<<<< HEAD
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
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isString()
    .withMessage("Reset token must be a string")
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid reset token format"),

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
  body("token")
    .notEmpty()
    .withMessage("Verification token is required")
    .isString()
    .withMessage("Token must be a string")
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid token format"),
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
=======
module.exports = { registerValidator, loginValidator, refreshValidator, mfaCodeValidator };
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

const express = require("express");
const {
  changePassword,
  disableMfa,
  enableMfa,
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  resetPassword,
  setupMfa,
  verifyEmail,
} = require("../controllers/authController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  registerValidator,
  loginValidator,
  refreshValidator,
  mfaCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} = require("../middleware/validators");

const router = express.Router();

router.post("/register", registerValidator, validate, asyncHandler(register));
router.post("/login", loginValidator, validate, asyncHandler(login));
router.post("/refresh", refreshValidator, validate, asyncHandler(refresh));
router.post("/logout", protect, asyncHandler(logout));
router.get("/me", protect, asyncHandler(getMe));
router.post("/mfa/setup", protect, asyncHandler(setupMfa));
router.post("/mfa/enable", protect, mfaCodeValidator, validate, asyncHandler(enableMfa));
router.post("/mfa/disable", protect, mfaCodeValidator, validate, asyncHandler(disableMfa));
router.post("/forgot-password", forgotPasswordValidator, validate, asyncHandler(forgotPassword));
router.post("/reset-password", resetPasswordValidator, validate, asyncHandler(resetPassword));
router.post("/change-password", protect, changePasswordValidator, validate, asyncHandler(changePassword));
router.post("/verify-email", verifyEmailValidator, validate, asyncHandler(verifyEmail));
router.post("/resend-verification", protect, resendVerificationValidator, validate, asyncHandler(resendVerification));

module.exports = router;

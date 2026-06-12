const express = require("express");
const {
<<<<<<< HEAD
  changePassword,
  disableMfa,
  enableMfa,
  forgotPassword,
=======
  disableMfa,
  enableMfa,
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
  getMe,
  login,
  logout,
  refresh,
  register,
<<<<<<< HEAD
  resendVerification,
  resetPassword,
  setupMfa,
  verifyEmail,
=======
  setupMfa,
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
} = require("../controllers/authController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  registerValidator,
  loginValidator,
  refreshValidator,
  mfaCodeValidator,
<<<<<<< HEAD
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
<<<<<<< HEAD
router.post("/forgot-password", forgotPasswordValidator, validate, asyncHandler(forgotPassword));
router.post("/reset-password", resetPasswordValidator, validate, asyncHandler(resetPassword));
router.post("/change-password", protect, changePasswordValidator, validate, asyncHandler(changePassword));
router.post("/verify-email", verifyEmailValidator, validate, asyncHandler(verifyEmail));
router.post("/resend-verification", protect, resendVerificationValidator, validate, asyncHandler(resendVerification));
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

module.exports = router;

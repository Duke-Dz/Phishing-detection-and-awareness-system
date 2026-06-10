const express = require("express");
const {
  disableMfa,
  enableMfa,
  getMe,
  login,
  logout,
  refresh,
  register,
  setupMfa,
} = require("../controllers/authController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  registerValidator,
  loginValidator,
  refreshValidator,
  mfaCodeValidator,
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

module.exports = router;

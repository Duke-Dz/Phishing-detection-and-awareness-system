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

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/logout", protect, asyncHandler(logout));
router.get("/me", protect, asyncHandler(getMe));
router.post("/mfa/setup", protect, asyncHandler(setupMfa));
router.post("/mfa/enable", protect, asyncHandler(enableMfa));
router.post("/mfa/disable", protect, asyncHandler(disableMfa));

module.exports = router;

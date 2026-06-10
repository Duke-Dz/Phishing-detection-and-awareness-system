const express = require("express");
const {
  createThreatIntel,
  getDashboardStats,
  getExternalApiStatus,
  listThreatIntel,
  listUsers,
  updateUser,
} = require("../controllers/adminController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { validate, updateUserValidator, createThreatIntelValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", asyncHandler(getDashboardStats));
router.get("/users", asyncHandler(listUsers));
router.patch("/users/:userId", updateUserValidator, validate, asyncHandler(updateUser));
router.get("/threat-intel", asyncHandler(listThreatIntel));
router.post("/threat-intel", createThreatIntelValidator, validate, asyncHandler(createThreatIntel));
router.get("/api-status", asyncHandler(getExternalApiStatus));

module.exports = router;

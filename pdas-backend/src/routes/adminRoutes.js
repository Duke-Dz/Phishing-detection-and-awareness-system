const express = require("express");
const {
  createThreatIntel,
  getDashboardStats,
  listThreatIntel,
  listUsers,
  updateUser,
} = require("../controllers/adminController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", asyncHandler(getDashboardStats));
router.get("/users", asyncHandler(listUsers));
router.patch("/users/:userId", asyncHandler(updateUser));
router.get("/threat-intel", asyncHandler(listThreatIntel));
router.post("/threat-intel", asyncHandler(createThreatIntel));

module.exports = router;

const express = require("express");
const {
  createThreatIntel,
<<<<<<< HEAD
  deleteThreatIntel,
  getAnalytics,
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
  getDashboardStats,
  getExternalApiStatus,
  listThreatIntel,
  listUsers,
<<<<<<< HEAD
  updateThreatIntel,
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
<<<<<<< HEAD
router.patch("/threat-intel/:threatId", asyncHandler(updateThreatIntel));
router.delete("/threat-intel/:threatId", asyncHandler(deleteThreatIntel));
router.get("/analytics", asyncHandler(getAnalytics));
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
router.get("/api-status", asyncHandler(getExternalApiStatus));

module.exports = router;

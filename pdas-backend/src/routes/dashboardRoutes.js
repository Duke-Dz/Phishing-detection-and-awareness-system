const express = require("express");
const { getUserDashboardStats } = require("../controllers/dashboardController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/stats", asyncHandler(getUserDashboardStats));

module.exports = router;

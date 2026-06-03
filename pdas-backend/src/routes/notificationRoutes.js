const express = require("express");
const {
  listNotifications,
  markNotificationRead,
} = require("../controllers/notificationController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", asyncHandler(listNotifications));
router.patch("/:notificationId/read", asyncHandler(markNotificationRead));

module.exports = router;

const express = require("express");
const {
  listNotifications,
  markNotificationRead,
<<<<<<< HEAD
  markAllNotificationsRead,
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
} = require("../controllers/notificationController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", asyncHandler(listNotifications));
<<<<<<< HEAD
router.patch("/read-all", asyncHandler(markAllNotificationsRead));
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
router.patch("/:notificationId/read", asyncHandler(markNotificationRead));

module.exports = router;

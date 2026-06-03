const express = require("express");
const {
  createAwarenessContent,
  deleteAwarenessContent,
  getAwarenessContent,
  listAwarenessContent,
  updateAwarenessContent,
} = require("../controllers/awarenessController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", asyncHandler(listAwarenessContent));
router.get("/:contentId", asyncHandler(getAwarenessContent));
router.post("/", authorize("analyst", "admin"), asyncHandler(createAwarenessContent));
router.patch("/:contentId", authorize("analyst", "admin"), asyncHandler(updateAwarenessContent));
router.delete("/:contentId", authorize("admin"), asyncHandler(deleteAwarenessContent));

module.exports = router;

const express = require("express");
const {
  createReport,
  getReport,
  listReports,
  updateReportStatus,
} = require("../controllers/reportController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.route("/").get(asyncHandler(listReports)).post(asyncHandler(createReport));
router.get("/:reportId", asyncHandler(getReport));
router.patch(
  "/:reportId/status",
  authorize("analyst", "admin"),
  asyncHandler(updateReportStatus),
);

module.exports = router;

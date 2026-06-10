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
const { validate, createReportValidator, updateReportStatusValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);
router.route("/").get(asyncHandler(listReports)).post(createReportValidator, validate, asyncHandler(createReport));
router.get("/:reportId", asyncHandler(getReport));
router.patch(
  "/:reportId/status",
  authorize("analyst", "admin"),
  updateReportStatusValidator,
  validate,
  asyncHandler(updateReportStatus),
);

module.exports = router;

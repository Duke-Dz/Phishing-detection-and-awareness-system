const express = require("express");
const { getScan, getScanJob, scanSms, scanUrl } = require("../controllers/scanController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/url", asyncHandler(scanUrl));
router.post("/sms", asyncHandler(scanSms));
router.get("/jobs/:jobId", asyncHandler(getScanJob));
router.get("/:scanId", asyncHandler(getScan));

module.exports = router;

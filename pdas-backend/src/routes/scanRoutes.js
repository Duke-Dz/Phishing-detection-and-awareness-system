const express = require("express");
const { getScan, getScanJob, scanSms, scanUrl } = require("../controllers/scanController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { validate, urlScanValidator, contentScanValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);
router.post("/url", urlScanValidator, validate, asyncHandler(scanUrl));
router.post("/sms", contentScanValidator, validate, asyncHandler(scanSms));
router.get("/jobs/:jobId", asyncHandler(getScanJob));
router.get("/:scanId", asyncHandler(getScan));

module.exports = router;

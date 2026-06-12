const express = require("express");
<<<<<<< HEAD
const { getScan, getScanJob, listScans, scanSms, scanUrl } = require("../controllers/scanController");
=======
const { getScan, getScanJob, scanSms, scanUrl } = require("../controllers/scanController");
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { validate, urlScanValidator, contentScanValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);
<<<<<<< HEAD
router.get("/", asyncHandler(listScans));
router.get("/history", asyncHandler(listScans));
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
router.post("/url", urlScanValidator, validate, asyncHandler(scanUrl));
router.post("/sms", contentScanValidator, validate, asyncHandler(scanSms));
router.get("/jobs/:jobId", asyncHandler(getScanJob));
router.get("/:scanId", asyncHandler(getScan));

module.exports = router;

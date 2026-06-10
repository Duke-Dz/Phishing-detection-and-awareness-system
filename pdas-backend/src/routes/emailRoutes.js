const express = require("express");
const { analyzeEmail, parseHeaders } = require("../controllers/emailController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { validate, contentScanValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);
router.post("/analyze", contentScanValidator, validate, asyncHandler(analyzeEmail));
router.post("/headers", asyncHandler(parseHeaders));

module.exports = router;

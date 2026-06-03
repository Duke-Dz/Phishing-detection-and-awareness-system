const express = require("express");
const { analyzeEmail, parseHeaders } = require("../controllers/emailController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/analyze", asyncHandler(analyzeEmail));
router.post("/headers", asyncHandler(parseHeaders));

module.exports = router;

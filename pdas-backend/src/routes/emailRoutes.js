const express = require("express");
const { analyzeEmail, parseHeaders } = require("../controllers/emailController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { validate, emailContentScanValidator } = require("../middleware/validators");

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /email/analyze:
 *   post:
 *     tags: [Email]
 *     summary: Analyze an email for phishing
 *     description: Submit email content for phishing analysis. Set async=true to queue the scan as a background job.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: The full email body content to analyze
 *                 example: "Dear user, your account has been compromised..."
 *               async:
 *                 type: boolean
 *                 description: Queue as a background job
 *     responses:
 *       201:
 *         description: Analysis completed synchronously
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       202:
 *         description: Analysis queued as a background job
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post("/analyze", emailContentScanValidator, validate, asyncHandler(analyzeEmail));

/**
 * @swagger
 * /email/headers:
 *   post:
 *     tags: [Email]
 *     summary: Parse email headers
 *     description: Parse raw email headers into a structured key-value object.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [headers]
 *             properties:
 *               headers:
 *                 type: string
 *                 description: Raw email headers as a multi-line string
 *                 example: "From: sender@example.com\nTo: recipient@example.com\nSubject: Test"
 *     responses:
 *       200:
 *         description: Parsed email headers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *       400:
 *         description: No valid headers found
 *       401:
 *         description: Not authenticated
 */
router.post("/headers", asyncHandler(parseHeaders));

module.exports = router;

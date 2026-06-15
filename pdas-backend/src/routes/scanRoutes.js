const express = require("express");
const { getScan, getScanJob, listScans, scanSms, scanUrl } = require("../controllers/scanController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { contentScanValidator, urlScanValidator, uuidParam, validate } = require("../middleware/validators");

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /scan:
 *   get:
 *     tags: [Scans]
 *     summary: List scan results
 *     description: Retrieve a paginated list of scan results. Regular users see only their own scans; admins and analysts see all scans. Supports filtering by scan_type, classification, and date range.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Number of results per page (max 100)
 *       - in: query
 *         name: scan_type
 *         schema:
 *           type: string
 *           enum: [url, email, sms]
 *         description: Filter by scan type
 *       - in: query
 *         name: classification
 *         schema:
 *           type: string
 *           enum: [safe, suspicious, phishing]
 *         description: Filter by classification
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter scans analyzed on or after this date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter scans analyzed on or before this date
 *     responses:
 *       200:
 *         description: Paginated list of scan results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated
 */
router.get("/", asyncHandler(listScans));

/**
 * @swagger
 * /scan/history:
 *   get:
 *     tags: [Scans]
 *     summary: List scan history
 *     description: Alias for GET /scan — returns the same paginated list of scan results.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: scan_type
 *         schema:
 *           type: string
 *           enum: [url, email, sms]
 *       - in: query
 *         name: classification
 *         schema:
 *           type: string
 *           enum: [safe, suspicious, phishing]
 *     responses:
 *       200:
 *         description: Paginated list of scan results
 *       401:
 *         description: Not authenticated
 */
router.get("/history", asyncHandler(listScans));

/**
 * @swagger
 * /scan/url:
 *   post:
 *     tags: [Scans]
 *     summary: Scan a URL
 *     description: Submit a URL for phishing analysis. Set async=true in query or body to queue the scan as a background job (returns 202).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com
 *               async:
 *                 type: boolean
 *                 description: Queue as a background job
 *     responses:
 *       201:
 *         description: Scan completed synchronously
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
 *         description: Scan queued as a background job
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post("/url", urlScanValidator, validate, asyncHandler(scanUrl));

/**
 * @swagger
 * /scan/sms:
 *   post:
 *     tags: [Scans]
 *     summary: Scan an SMS message
 *     description: Submit SMS content for phishing analysis. Set async=true to queue the scan as a background job.
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
 *                 example: "You've won a prize! Click here: http://suspicious.link"
 *               sender:
 *                 type: string
 *                 description: Optional sender identifier
 *               async:
 *                 type: boolean
 *                 description: Queue as a background job
 *     responses:
 *       201:
 *         description: Scan completed synchronously
 *       202:
 *         description: Scan queued as a background job
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post("/sms", contentScanValidator, validate, asyncHandler(scanSms));

/**
 * @swagger
 * /scan/jobs/{jobId}:
 *   get:
 *     tags: [Scans]
 *     summary: Get a scan job status
 *     description: Retrieve the status and result (if completed) of an async scan job.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The scan job ID
 *     responses:
 *       200:
 *         description: Scan job details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this job
 *       404:
 *         description: Scan job not found
 */
router.get("/jobs/:jobId", uuidParam("jobId"), validate, asyncHandler(getScanJob));

/**
 * @swagger
 * /scan/{scanId}:
 *   get:
 *     tags: [Scans]
 *     summary: Get a scan result
 *     description: Retrieve a specific scan result by its ID. Regular users can only view their own scans.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The scan result ID
 *     responses:
 *       200:
 *         description: Scan result details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this scan
 *       404:
 *         description: Scan result not found
 */
router.get("/:scanId", uuidParam("scanId"), validate, asyncHandler(getScan));

module.exports = router;

const express = require("express");
const {
  createReport,
  getAttachment,
  getReport,
  listReports,
  requireReportAccess,
  updateReportStatus,
  uploadAttachment,
} = require("../controllers/reportController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createReportValidator,
  filenameParam,
  updateReportStatusValidator,
  uuidParam,
  validate,
} = require("../middleware/validators");
const { addComment, getComments } = require("../controllers/reportCommentController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /reports:
 *   get:
 *     tags: [Reports]
 *     summary: List phishing reports
 *     description: Retrieve a paginated list of phishing reports. Regular users see only their own reports; admins and analysts see all.
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
 *     responses:
 *       200:
 *         description: Paginated list of reports
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
 *   post:
 *     tags: [Reports]
 *     summary: Create a phishing report
 *     description: Submit suspicious content for analysis. The system automatically scans the content and creates a linked scan result.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [report_type, content]
 *             properties:
 *               report_type:
 *                 type: string
 *                 enum: [url, email, sms]
 *               content:
 *                 type: string
 *                 description: The suspicious URL, email body, or SMS content
 *               notes:
 *                 type: string
 *                 description: Optional notes about the report
 *     responses:
 *       201:
 *         description: Report created with scan result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       type: object
 *                     scanResult:
 *                       type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.route("/").get(asyncHandler(listReports)).post(createReportValidator, validate, asyncHandler(createReport));

/**
 * @swagger
 * /reports/{reportId}:
 *   get:
 *     tags: [Reports]
 *     summary: Get a specific report
 *     description: Retrieve a report by its ID, including the linked scan result. Regular users can only view their own reports.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The report ID
 *     responses:
 *       200:
 *         description: Report details with scan result
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
 *         description: Not authorized to view this report
 *       404:
 *         description: Report not found
 */
router.get("/:reportId", uuidParam("reportId"), validate, asyncHandler(getReport));

/**
 * @swagger
 * /reports/{reportId}/status:
 *   patch:
 *     tags: [Reports]
 *     summary: Update report status
 *     description: Update the status of a report. Only analysts and admins can perform this action. Sends a notification and email to the report author.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, under_review, confirmed, false_positive]
 *               notes:
 *                 type: string
 *                 description: Optional notes about the status change
 *     responses:
 *       200:
 *         description: Report status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires analyst or admin role
 *       404:
 *         description: Report not found
 */
router.patch(
  "/:reportId/status",
  uuidParam("reportId"),
  updateReportStatusValidator,
  validate,
  authorize("analyst", "admin"),
  asyncHandler(updateReportStatus),
);

/**
 * @swagger
 * /reports/{id}/comments:
 *   post:
 *     summary: Add a comment to a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *   get:
 *     summary: Get all comments for a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/comments", uuidParam("id"), validate, asyncHandler(addComment));
router.get("/:id/comments", uuidParam("id"), validate, asyncHandler(getComments));

/**
 * @swagger
 * /reports/{id}/attachments:
 *   post:
 *     summary: Upload an evidence attachment for a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/attachments/:filename",
  uuidParam("id"),
  filenameParam("filename"),
  validate,
  asyncHandler(requireReportAccess),
  asyncHandler(getAttachment),
);

router.post(
  "/:id/attachments",
  uuidParam("id"),
  validate,
  asyncHandler(requireReportAccess),
  upload.single("attachment"),
  asyncHandler(uploadAttachment),
);

module.exports = router;

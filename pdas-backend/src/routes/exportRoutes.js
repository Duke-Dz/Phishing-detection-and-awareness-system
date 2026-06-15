const express = require("express");
const { exportScanHistory } = require("../controllers/exportController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /export/scans:
 *   get:
 *     tags: [Export]
 *     summary: Export scan history
 *     description: Export the authenticated user's scan history as CSV or JSON. Limited to 1000 records. Supports optional date range filtering.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter scans analyzed on or after this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter scans analyzed on or before this date
 *     responses:
 *       200:
 *         description: Scan history export
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       scan_id:
 *                         type: string
 *                       target:
 *                         type: string
 *                       scan_type:
 *                         type: string
 *                       risk_score:
 *                         type: number
 *                       classification:
 *                         type: string
 *                       engine_version:
 *                         type: string
 *                       analyzed_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 */
router.get("/scans", asyncHandler(exportScanHistory));

module.exports = router;

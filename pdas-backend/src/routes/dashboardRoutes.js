const express = require("express");
const { getUserDashboardStats } = require("../controllers/dashboardController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get user dashboard statistics
 *     description: Retrieve dashboard statistics for the authenticated user including scan counts by classification, recent scan activity (last 7 days), report count, unread notifications, and scan type breakdown.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard statistics
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
 *                     totalScans:
 *                       type: integer
 *                     phishingScans:
 *                       type: integer
 *                     suspiciousScans:
 *                       type: integer
 *                     safeScans:
 *                       type: integer
 *                     recentScans:
 *                       type: integer
 *                     totalReports:
 *                       type: integer
 *                     unreadNotifications:
 *                       type: integer
 *                     scanTypeBreakdown:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Not authenticated
 */
router.get("/stats", asyncHandler(getUserDashboardStats));

module.exports = router;

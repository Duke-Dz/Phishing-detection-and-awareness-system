const express = require("express");
const {
  createThreatIntel,
  deleteThreatIntel,
  getAnalytics,
  getDashboardStats,
  getExternalApiStatus,
  listThreatIntel,
  listUsers,
  updateThreatIntel,
  updateUser,
} = require("../controllers/adminController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createThreatIntelValidator,
  updateThreatIntelValidator,
  updateUserValidator,
  uuidParam,
  validate,
} = require("../middleware/validators");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics
 *     description: Retrieve system-wide statistics including total users, reports, scan classifications, queued/failed jobs, and published lessons. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     totalUsers:
 *                       type: integer
 *                     totalReports:
 *                       type: integer
 *                     queuedScanJobs:
 *                       type: integer
 *                     failedScanJobs:
 *                       type: integer
 *                     phishingScans:
 *                       type: integer
 *                     suspiciousScans:
 *                       type: integer
 *                     safeScans:
 *                       type: integer
 *                     unreadNotifications:
 *                       type: integer
 *                     publishedLessons:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 */
router.get("/stats", asyncHandler(getDashboardStats));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     description: Retrieve a paginated list of users with optional search by name or email. Requires admin role.
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Paginated list of users
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
 *       403:
 *         description: Requires admin role
 */
router.get("/users", asyncHandler(listUsers));

/**
 * @swagger
 * /admin/users/{userId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a user
 *     description: Update a user's role or active status. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, analyst, admin]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 *       404:
 *         description: User not found
 */
router.patch("/users/:userId", uuidParam("userId"), updateUserValidator, validate, asyncHandler(updateUser));

/**
 * @swagger
 * /admin/threat-intel:
 *   get:
 *     tags: [Admin]
 *     summary: List threat intelligence entries
 *     description: Retrieve a paginated list of threat intelligence records. Requires admin role.
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
 *         description: Paginated list of threat intelligence entries
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 */
router.get("/threat-intel", asyncHandler(listThreatIntel));

/**
 * @swagger
 * /admin/threat-intel:
 *   post:
 *     tags: [Admin]
 *     summary: Create a threat intelligence entry
 *     description: Add a new threat intelligence record (domain, reputation, blacklist info). Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [domain]
 *             properties:
 *               domain:
 *                 type: string
 *                 example: suspicious-domain.com
 *               reputation_score:
 *                 type: number
 *                 default: 80
 *               is_blacklisted:
 *                 type: boolean
 *                 default: false
 *               blacklist_sources:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: ["manual"]
 *               threat_type:
 *                 type: string
 *                 default: unknown
 *     responses:
 *       201:
 *         description: Threat intelligence entry created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 */
router.post("/threat-intel", createThreatIntelValidator, validate, asyncHandler(createThreatIntel));

/**
 * @swagger
 * /admin/threat-intel/{threatId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a threat intelligence entry
 *     description: Update an existing threat intelligence record. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The threat intelligence entry ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domain:
 *                 type: string
 *               reputation_score:
 *                 type: number
 *               is_blacklisted:
 *                 type: boolean
 *               blacklist_sources:
 *                 type: array
 *                 items:
 *                   type: string
 *               threat_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Threat intelligence entry updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 *       404:
 *         description: Threat intelligence entry not found
 */
router.patch(
  "/threat-intel/:threatId",
  uuidParam("threatId"),
  updateThreatIntelValidator,
  validate,
  asyncHandler(updateThreatIntel),
);

/**
 * @swagger
 * /admin/threat-intel/{threatId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a threat intelligence entry
 *     description: Permanently delete a threat intelligence record. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The threat intelligence entry ID
 *     responses:
 *       200:
 *         description: Threat intelligence entry deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 *       404:
 *         description: Threat intelligence entry not found
 */
router.delete("/threat-intel/:threatId", uuidParam("threatId"), validate, asyncHandler(deleteThreatIntel));

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get analytics data
 *     description: Retrieve analytics for the last 30 days including daily scan counts, classification breakdown, top targeted domains, and user growth. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
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
 *                     dailyScans:
 *                       type: array
 *                       items:
 *                         type: object
 *                     classificationBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topDomains:
 *                       type: array
 *                       items:
 *                         type: object
 *                     userGrowth:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 */
router.get("/analytics", asyncHandler(getAnalytics));

/**
 * @swagger
 * /admin/api-status:
 *   get:
 *     tags: [Admin]
 *     summary: Get external API status
 *     description: Check the availability and status of external threat intelligence APIs used by the system. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: External API status information
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
 *         description: Requires admin role
 */
router.get("/api-status", asyncHandler(getExternalApiStatus));

module.exports = router;

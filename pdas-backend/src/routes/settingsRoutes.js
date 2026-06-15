const express = require("express");
const { getSettings, updateSetting } = require("../controllers/settingsController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all public system settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved
 */
router.get("/", asyncHandler(getSettings));

/**
 * @swagger
 * /settings/{key}:
 *   put:
 *     summary: Update a system setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */
router.put("/:key", protect, authorize("admin"), asyncHandler(updateSetting));

module.exports = router;

const express = require("express");
const { getAvatar, updateProfile, uploadAvatar, unsubscribe } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { filenameParam, updateProfileValidator, validate } = require("../middleware/validators");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/profile", protect, updateProfileValidator, validate, asyncHandler(updateProfile));

/**
 * @swagger
 * /users/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 */
router.post("/avatar", protect, upload.single("avatar"), asyncHandler(uploadAvatar));

router.get(
  "/avatar/:filename",
  protect,
  filenameParam("filename"),
  validate,
  asyncHandler(getAvatar),
);

/**
 * @swagger
 * /users/unsubscribe:
 *   post:
 *     summary: Unsubscribe from email notifications
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 */
router.post("/unsubscribe", asyncHandler(unsubscribe));

module.exports = router;

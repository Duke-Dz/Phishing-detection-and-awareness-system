const express = require("express");
const {
  createAwarenessContent,
  deleteAwarenessContent,
  getAwarenessContent,
  listAwarenessContent,
  updateAwarenessContent,
} = require("../controllers/awarenessController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createAwarenessValidator,
  updateAwarenessValidator,
  uuidParam,
  validate,
} = require("../middleware/validators");

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /awareness:
 *   get:
 *     tags: [Awareness]
 *     summary: List awareness content
 *     description: Retrieve a paginated list of awareness lessons. Regular users only see published content; admins and analysts see all.
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
 *         description: Paginated list of awareness lessons
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
router.get("/", asyncHandler(listAwarenessContent));

/**
 * @swagger
 * /awareness/{contentId}:
 *   get:
 *     tags: [Awareness]
 *     summary: Get awareness content by ID
 *     description: Retrieve a specific awareness lesson. Unpublished content is only visible to admins and analysts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The awareness content ID
 *     responses:
 *       200:
 *         description: Awareness content details
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
 *         description: Lesson is not published
 *       404:
 *         description: Awareness content not found
 */
router.get("/:contentId", uuidParam("contentId"), validate, asyncHandler(getAwarenessContent));

/**
 * @swagger
 * /awareness:
 *   post:
 *     tags: [Awareness]
 *     summary: Create awareness content
 *     description: Create a new awareness lesson. Requires analyst or admin role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description]
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               body:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: beginner
 *               duration_minutes:
 *                 type: integer
 *                 default: 5
 *               is_published:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Awareness content created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires analyst or admin role
 */
router.post("/", authorize("analyst", "admin"), createAwarenessValidator, validate, asyncHandler(createAwarenessContent));

/**
 * @swagger
 * /awareness/{contentId}:
 *   patch:
 *     tags: [Awareness]
 *     summary: Update awareness content
 *     description: Update an existing awareness lesson. Requires analyst or admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The awareness content ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               body:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               duration_minutes:
 *                 type: integer
 *               is_published:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Awareness content updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires analyst or admin role
 *       404:
 *         description: Awareness content not found
 */
router.patch(
  "/:contentId",
  uuidParam("contentId"),
  updateAwarenessValidator,
  validate,
  authorize("analyst", "admin"),
  asyncHandler(updateAwarenessContent),
);

/**
 * @swagger
 * /awareness/{contentId}:
 *   delete:
 *     tags: [Awareness]
 *     summary: Delete awareness content
 *     description: Permanently delete an awareness lesson. Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The awareness content ID
 *     responses:
 *       200:
 *         description: Awareness content deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Requires admin role
 *       404:
 *         description: Awareness content not found
 */
router.delete("/:contentId", uuidParam("contentId"), validate, authorize("admin"), asyncHandler(deleteAwarenessContent));

module.exports = router;

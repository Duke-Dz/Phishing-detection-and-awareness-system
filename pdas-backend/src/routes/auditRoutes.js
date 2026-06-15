const express = require("express");
const { getAuditLogs } = require("../controllers/auditController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", asyncHandler(getAuditLogs));

module.exports = router;

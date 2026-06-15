const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { addClient } = require("../services/sseService");

const router = express.Router();

// GET /stream — SSE endpoint (protected)
router.get("/stream", protect, (req, res) => {
  addClient(req.user.user_id, res);
});

module.exports = router;

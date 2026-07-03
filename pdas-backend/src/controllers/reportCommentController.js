const { ReportComment, Report, User } = require("../models");
const { createError } = require("../utils/inputValidation");
const sseService = require("../services/sseService");
const auditService = require("../services/auditService");

/**
 * @desc    Add a comment to a specific report ticket
 * @route   POST /api/reports/:id/comments
 * @access  Private (Owner or Admin/Analyst)
 */
const addComment = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) throw createError("Message is required", 400);

  const report = await Report.findByPk(id);
  if (!report) throw createError("Report not found", 404);

  // Only admins/analysts or the report owner can comment
  if (req.user.role === "user" && report.user_id !== req.user.user_id) {
    throw createError("Not authorized to comment on this report", 403);
  }

  const comment = await ReportComment.create({
    report_id: id,
    user_id: req.user.user_id,
    message,
  });

  // Notify the other party
  const recipientId = req.user.role === "user" ? null : report.user_id; // If analyst commented, notify user
  if (recipientId) {
    sseService.sendToUser(recipientId, "report_comment", {
      report_id: id,
      comment_id: comment.comment_id,
      message: message.substring(0, 50) + "...",
    });
  }

  auditService.logAction({
    userId: req.user.user_id,
    action: "report.add_comment",
    entityType: "report",
    entityId: id,
    req,
  });

  // Fetch comment with user info
  const fullComment = await ReportComment.findByPk(comment.comment_id, {
    include: [{ model: User, as: "author", attributes: ["user_id", "full_name", "role", "avatar_url"] }],
  });

  res.status(201).json({
    success: true,
    message: "Comment added",
    data: fullComment,
  });
};

/**
 * @desc    Get all comments for a specific report ticket
 * @route   GET /api/reports/:id/comments
 * @access  Private (Owner or Admin/Analyst)
 */
const getComments = async (req, res) => {
  const { id } = req.params;

  const report = await Report.findByPk(id);
  if (!report) throw createError("Report not found", 404);

  if (req.user.role === "user" && report.user_id !== req.user.user_id) {
    throw createError("Not authorized to view comments", 403);
  }

  const comments = await ReportComment.findAll({
    where: { report_id: id },
    include: [{ model: User, as: "author", attributes: ["user_id", "full_name", "role", "avatar_url"] }],
    order: [["created_at", "ASC"]],
  });

  res.json({
    success: true,
    data: comments,
  });
};

module.exports = {
  addComment,
  getComments,
};

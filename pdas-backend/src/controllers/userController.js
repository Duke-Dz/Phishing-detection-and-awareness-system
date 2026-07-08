const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { User } = require("../models");
const { createError } = require("../utils/inputValidation");
const auditService = require("../services/auditService");
const { clearUserCache } = require("../middleware/authMiddleware");
const { decodeUnsubscribeToken, verifyUnsubscribeToken } = require("../utils/unsubscribeTokens");

const updateProfile = async (req, res) => {
  const { full_name } = req.body;

  if (!full_name) {
    throw createError("Full name is required", 400);
  }

  const user = await User.findByPk(req.user.user_id);
  if (!user) throw createError("User not found", 404);

  user.full_name = full_name;
  await user.save();
  clearUserCache(user.user_id);

  auditService.logAction({
    userId: user.user_id,
    action: "user.update_profile",
    entityType: "user",
    entityId: user.user_id,
    req,
  });

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      full_name: user.full_name,
      avatar_url: user.avatar_url,
    },
  });
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    throw createError("No file uploaded", 400);
  }

  const user = await User.findByPk(req.user.user_id);
  if (!user) throw createError("User not found", 404);

  const avatarPath = `/api/users/avatar/${req.file.filename}`;
  user.avatar_url = avatarPath;
  await user.save();
  clearUserCache(user.user_id);

  auditService.logAction({
    userId: user.user_id,
    action: "user.upload_avatar",
    entityType: "user",
    entityId: user.user_id,
    req,
  });

  res.json({
    success: true,
    message: "Avatar uploaded successfully",
    avatar_url: avatarPath,
  });
};

const getAvatar = async (req, res) => {
  const avatarUrl = `/api/users/avatar/${req.params.filename}`;
  const legacyUrl = `/uploads/avatars/${req.params.filename}`;
  const user = await User.findOne({
    where: {
      avatar_url: { [Op.in]: [avatarUrl, legacyUrl] },
    },
  });

  if (!user) {
    throw createError("Avatar not found", 404);
  }

  const uploadRoot = path.resolve("uploads", "avatars");
  const filePath = path.resolve(uploadRoot, req.params.filename);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw createError("Invalid avatar path", 400);
  }
  if (!fs.existsSync(filePath)) {
    throw createError("Avatar file not found", 404);
  }

  res.sendFile(filePath);
};

const unsubscribe = async (req, res) => {
  const { email, token } = req.body;

  if (!token) {
    throw createError("Unsubscribe token is required", 400);
  }

  const decoded = decodeUnsubscribeToken(token);
  const targetEmail = decoded?.email || String(email || "").trim().toLowerCase();

  if (!targetEmail || !verifyUnsubscribeToken(targetEmail, token)) {
    throw createError("Invalid or expired unsubscribe link", 403);
  }

  const user = await User.findOne({ where: { email: targetEmail } });
  
  if (!user) {
    // If user doesn't exist, just return success to prevent email enumeration
    return res.json({ success: true, message: "Successfully unsubscribed" });
  }

  user.email_notifications = false;
  await user.save();
  clearUserCache(user.user_id);

  auditService.logAction({
    userId: user.user_id,
    action: "user.unsubscribe",
    entityType: "user",
    entityId: user.user_id,
    req,
  });

  res.json({
    success: true,
    message: "Successfully unsubscribed from email notifications",
  });
};

module.exports = {
  getAvatar,
  updateProfile,
  uploadAvatar,
  unsubscribe,
};

const { Notification } = require("../models");
const { createError } = require("../utils/validators");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");

const listNotifications = async (req, res) => {
  const pagination = getPagination(req.query);
  const { count, rows: notifications } = await Notification.findAndCountAll({
    where: { user_id: req.user.user_id },
    order: [["created_at", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    success: true,
    count: notifications.length,
    pagination: buildPaginationMeta({ count, ...pagination }),
    data: notifications,
  });
};

const markNotificationRead = async (req, res) => {
  const notification = await Notification.findByPk(req.params.notificationId);
  if (!notification) {
    throw createError("Notification not found", 404);
  }

  if (notification.user_id !== req.user.user_id && req.user.role !== "admin") {
    throw createError("You cannot update this notification", 403);
  }

  notification.is_read = true;
  await notification.save();

  res.json({
    success: true,
    data: notification,
  });
};

module.exports = { listNotifications, markNotificationRead };

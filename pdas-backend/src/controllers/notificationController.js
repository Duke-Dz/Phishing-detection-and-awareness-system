const { Notification } = require("../models");
const cacheService = require("../services/cacheService");
const { createError } = require("../utils/inputValidation");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");

const listNotifications = async (req, res) => {
  const pagination = getPagination(req.query);
  const payload = await cacheService.getOrSet(
    cacheService.keys.notifications(req.user.user_id, req.query),
    async () => {
      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: { user_id: req.user.user_id },
        order: [["created_at", "DESC"]],
        limit: pagination.limit,
        offset: pagination.offset,
      });

      return {
        count: notifications.length,
        pagination: buildPaginationMeta({ count, ...pagination }),
        data: notifications,
      };
    },
    cacheService.TTL.LIST_PAGE,
  );

  res.json({
    success: true,
    ...payload,
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
  cacheService.del(cacheService.keys.dashboardStats(notification.user_id));
  cacheService.del(cacheService.keys.systemStats());
  cacheService.delByPrefix(`notifications:${notification.user_id}:`);

  res.json({
    success: true,
    data: notification,
  });
};

const markAllNotificationsRead = async (req, res) => {
  const [updatedCount] = await Notification.update(
    { is_read: true },
    { where: { user_id: req.user.user_id, is_read: false } },
  );
  cacheService.del(cacheService.keys.dashboardStats(req.user.user_id));
  cacheService.del(cacheService.keys.systemStats());
  cacheService.delByPrefix(`notifications:${req.user.user_id}:`);

  res.json({
    success: true,
    message: `${updatedCount} notification(s) marked as read.`,
    data: { updated_count: updatedCount },
  });
};

const clearReadNotifications = async (req, res) => {
  const deletedCount = await Notification.destroy({
    where: { user_id: req.user.user_id, is_read: true },
  });
  cacheService.del(cacheService.keys.dashboardStats(req.user.user_id));
  cacheService.del(cacheService.keys.systemStats());
  cacheService.delByPrefix(`notifications:${req.user.user_id}:`);

  res.json({
    success: true,
    message: `${deletedCount} read notification(s) cleared.`,
    data: { deleted_count: deletedCount },
  });
};

module.exports = { listNotifications, markNotificationRead, markAllNotificationsRead, clearReadNotifications };

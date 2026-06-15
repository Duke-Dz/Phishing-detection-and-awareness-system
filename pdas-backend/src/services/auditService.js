const { Op } = require("sequelize");
const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

// ── Action Constants ─────────────────────────────────────────────────────────
const ACTIONS = {
  AUTH_LOGIN: "auth.login",
  AUTH_REGISTER: "auth.register",
  AUTH_LOGOUT: "auth.logout",
  SCAN_URL: "scan.url",
  SCAN_EMAIL: "scan.email",
  SCAN_SMS: "scan.sms",
  REPORT_CREATE: "report.create",
  REPORT_STATUS_UPDATE: "report.status_update",
  ADMIN_ROLE_CHANGE: "admin.role_change",
  ADMIN_STATUS_TOGGLE: "admin.status_toggle",
  AWARENESS_CREATE: "awareness.create",
  AWARENESS_UPDATE: "awareness.update",
  AWARENESS_DELETE: "awareness.delete",
  MFA_ENABLE: "mfa.enable",
  MFA_DISABLE: "mfa.disable",
  PASSWORD_CHANGE: "password.change",
  PASSWORD_RESET: "password.reset",
};

/**
 * Create an audit log entry (fire-and-forget).
 * Errors are caught silently and logged via Winston so callers are never blocked.
 */
const logAction = ({ userId = null, action, entityType = null, entityId = null, details = null, req = null }) => {
  const entry = {
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: req?.ip || null,
    user_agent: req?.headers?.["user-agent"] || null,
  };

  AuditLog.create(entry).catch((err) => {
    logger.error(`Audit log failed: ${err.message}`);
  });
};

/**
 * Query audit logs with pagination and optional filters.
 */
const getAuditLogs = async ({ page, pageSize, userId, action, entityType, startDate, endDate } = {}) => {
  const pagination = getPagination({ page, page_size: pageSize });
  const where = {};

  if (userId) {
    where.user_id = userId;
  }

  if (action) {
    where.action = action;
  }

  if (entityType) {
    where.entity_type = entityType;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      where.created_at[Op.lte] = new Date(endDate);
    }
  }

  const { count, rows: logs } = await AuditLog.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return {
    logs,
    pagination: buildPaginationMeta({ count, ...pagination }),
  };
};

module.exports = { ACTIONS, logAction, getAuditLogs };

const { getAuditLogs } = require("../services/auditService");

const getAuditLogsHandler = async (req, res) => {
  const { page, page_size, user_id, action, entity_type, start_date, end_date } = req.query;

  const result = await getAuditLogs({
    page,
    pageSize: page_size,
    userId: user_id,
    action,
    entityType: entity_type,
    startDate: start_date,
    endDate: end_date,
  });

  res.json({
    success: true,
    count: result.logs.length,
    pagination: result.pagination,
    data: result.logs,
  });
};

module.exports = { getAuditLogs: getAuditLogsHandler };

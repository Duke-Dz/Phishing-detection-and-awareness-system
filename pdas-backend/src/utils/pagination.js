const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getPagination = (query = {}) => {
  const page = clamp(Number.parseInt(query.page || "1", 10) || 1, 1, 100000);
  const pageSize = clamp(Number.parseInt(query.page_size || query.limit || "25", 10) || 25, 1, 100);
  const offset = (page - 1) * pageSize;

  return {
    limit: pageSize,
    offset,
    page,
    pageSize,
  };
};

const buildPaginationMeta = ({ count, page, pageSize }) => ({
  total: count,
  page,
  page_size: pageSize,
  total_pages: Math.max(Math.ceil(count / pageSize), 1),
});

module.exports = { buildPaginationMeta, getPagination };

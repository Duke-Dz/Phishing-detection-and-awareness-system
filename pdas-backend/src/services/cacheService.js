/**
 * In-memory cache service.
 *
 * Provides a cache-aside layer using node-cache to reduce database load and
 * speed up repeated lookups. The API is intentionally small so Redis can
 * replace the backing store later.
 */

const NodeCache = require("node-cache");
const logger = require("../utils/logger");

const TTL = {
  SCAN_RESULT: 300,
  DASHBOARD_STATS: 60,
  LIST_PAGE: 60,
  THREAT_INTEL: 3600,
  AWARENESS_LIST: 300,
  SYSTEM_STATS: 60,
};

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true,
});

cache.on("expired", (key) => {
  logger.debug(`Cache expired: ${key}`);
});

const get = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
  }
  return value;
};

const set = (key, value, ttl) => {
  cache.set(key, value, ttl || undefined);
  logger.debug(`Cache SET: ${key} (TTL: ${ttl || "default"}s)`);
};

const del = (key) => {
  cache.del(key);
};

const delByPrefix = (prefix) => {
  const keys = cache.keys().filter((key) => key.startsWith(prefix));
  if (keys.length > 0) {
    cache.del(keys);
    logger.debug(`Cache INVALIDATED ${keys.length} keys with prefix: ${prefix}`);
  }
};

const flush = () => {
  cache.flushAll();
  logger.info("Cache flushed");
};

const getStats = () => {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hit_rate: stats.hits + stats.misses > 0
      ? Number(((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1))
      : 0,
    ksize: stats.ksize,
    vsize: stats.vsize,
  };
};

const getOrSet = async (key, fetchFn, ttl) => {
  const cached = get(key);
  if (cached !== undefined) return cached;

  const value = await fetchFn();
  set(key, value, ttl);
  return value;
};

const stableQuery = (query = {}) =>
  Object.keys(query)
    .sort()
    .reduce((result, key) => {
      result[key] = query[key];
      return result;
    }, {});

const keys = {
  scanResult: (target) => `scan:${target}`,
  scanDetail: (scanId) => `scan:detail:${scanId}`,
  scanList: (userId, query) => `scan:list:${userId || "all"}:${JSON.stringify(stableQuery(query))}`,
  reportDetail: (reportId) => `reports:detail:${reportId}`,
  reportList: (userId, query) => `reports:list:${userId || "all"}:${JSON.stringify(stableQuery(query))}`,
  userSession: (userId) => `user:session:${userId}`,
  dashboardStats: (userId) => `dashboard:${userId}`,
  notifications: (userId, query) => `notifications:${userId}:${JSON.stringify(stableQuery(query))}`,
  threatIntel: (domain) => `threat:${domain}`,
  threatIntelList: (query) => `threat:list:${JSON.stringify(stableQuery(query))}`,
  adminUsers: (query) => `admin:users:${JSON.stringify(stableQuery(query))}`,
  adminAnalytics: () => "admin:analytics",
  settings: () => "settings:all",
  awarenessList: (role, query) => `awareness:list:${role || "public"}:${JSON.stringify(stableQuery(query))}`,
  systemStats: () => "admin:system_stats",
};

module.exports = {
  get,
  set,
  del,
  delByPrefix,
  flush,
  getStats,
  getOrSet,
  keys,
  TTL,
};

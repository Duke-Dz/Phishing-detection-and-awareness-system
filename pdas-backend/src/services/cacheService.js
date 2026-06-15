/**
 * In-Memory Cache Service
 *
 * Provides a simple caching layer using node-cache to reduce database load
 * and speed up repeated lookups. Designed as a drop-in replacement that can
 * later be swapped for Redis when scaling demands it.
 */

const NodeCache = require("node-cache");
const logger = require("../utils/logger");

// Default TTLs (seconds)
const TTL = {
  SCAN_RESULT: 300,       // 5 minutes — identical URL re-scans
  DASHBOARD_STATS: 60,    // 1 minute  — dashboard aggregations
  THREAT_INTEL: 3600,     // 1 hour    — domain reputation lookups
  AWARENESS_LIST: 300,    // 5 minutes — awareness content list
};

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,      // Performance: return references, not deep copies
  deleteOnExpire: true,
});

cache.on("expired", (key) => {
  logger.debug(`Cache expired: ${key}`);
});

/**
 * Get a value from cache.
 * @param {string} key
 * @returns {*} cached value or undefined
 */
const get = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
  }
  return value;
};

/**
 * Set a value in cache.
 * @param {string} key
 * @param {*} value
 * @param {number} [ttl] - TTL in seconds, uses default if omitted
 */
const set = (key, value, ttl) => {
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
  logger.debug(`Cache SET: ${key} (TTL: ${ttl || "default"}s)`);
};

/**
 * Delete a specific key.
 * @param {string} key
 */
const del = (key) => {
  cache.del(key);
};

/**
 * Delete all keys matching a prefix.
 * Useful for invalidating related cache entries (e.g., all dashboard stats).
 * @param {string} prefix
 */
const delByPrefix = (prefix) => {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length > 0) {
    cache.del(keys);
    logger.debug(`Cache INVALIDATED ${keys.length} keys with prefix: ${prefix}`);
  }
};

/**
 * Flush the entire cache.
 */
const flush = () => {
  cache.flushAll();
  logger.info("Cache flushed");
};

/**
 * Get cache statistics.
 */
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

/**
 * Cache-aside pattern helper.
 * Returns cached value if available, otherwise calls fetchFn and caches the result.
 * @param {string} key
 * @param {Function} fetchFn - async function that returns the value to cache
 * @param {number} [ttl] - TTL in seconds
 * @returns {Promise<*>}
 */
const getOrSet = async (key, fetchFn, ttl) => {
  const cached = get(key);
  if (cached !== undefined) return cached;

  const value = await fetchFn();
  set(key, value, ttl);
  return value;
};

// --- Key builders ---

const keys = {
  scanResult: (target) => `scan:${target}`,
  dashboardStats: (userId) => `dashboard:${userId}`,
  threatIntel: (domain) => `threat:${domain}`,
  awarenessList: (page, pageSize) => `awareness:list:${page}:${pageSize}`,
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

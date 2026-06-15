const logger = require("../utils/logger");

// ── Active SSE connections keyed by user_id ──────────────────────────────────
const clients = new Map();

/**
 * Register an SSE response object for a user.
 * Sets required headers, sends initial comment, and handles cleanup on close.
 * @param {string} userId
 * @param {import("express").Response} res
 */
const addClient = (userId, res) => {
  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Send initial connected comment
  res.write(":connected\n\n");

  // Store client connection
  clients.set(userId, res);
  logger.info(`SSE client connected: ${userId} (active: ${clients.size})`);

  // Clean up on close
  res.on("close", () => {
    removeClient(userId);
  });
};

/**
 * Remove a client connection.
 * @param {string} userId
 */
const removeClient = (userId) => {
  clients.delete(userId);
  logger.info(`SSE client disconnected: ${userId} (active: ${clients.size})`);
};

/**
 * Send an SSE event to a specific user.
 * Silently skips if no client is connected for that user.
 * @param {string} userId
 * @param {string} event - Event name
 * @param {*} data - Data to JSON-serialize
 */
const sendToUser = (userId, event, data) => {
  const client = clients.get(userId);
  if (!client) return;

  try {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    logger.warn(`SSE send failed for user ${userId}: ${error.message}`);
    removeClient(userId);
  }
};

/**
 * Broadcast an SSE event to all connected clients.
 * @param {string} event - Event name
 * @param {*} data - Data to JSON-serialize
 */
const sendToAll = (event, data) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const [userId, client] of clients) {
    try {
      client.write(payload);
    } catch (error) {
      logger.warn(`SSE broadcast failed for user ${userId}: ${error.message}`);
      removeClient(userId);
    }
  }
};

/**
 * Return the count of active SSE connections.
 * @returns {number}
 */
const getActiveConnections = () => clients.size;

module.exports = { addClient, removeClient, sendToUser, sendToAll, getActiveConnections };

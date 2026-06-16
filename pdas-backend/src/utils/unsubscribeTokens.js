const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "fallback_secret_for_hmac";

/**
 * Generates an HMAC token for a given email address.
 * This is used to securely verify unsubscribe links without requiring a database lookup.
 * @param {string} email
 * @returns {string} The HMAC token
 */
const generateUnsubscribeToken = (email) => {
  return crypto.createHmac("sha256", SECRET).update(email.toLowerCase()).digest("hex");
};

/**
 * Verifies if the provided token is valid for the given email.
 * @param {string} email
 * @param {string} token
 * @returns {boolean} True if valid
 */
const verifyUnsubscribeToken = (email, token) => {
  if (!email || !token) return false;
  const expectedToken = generateUnsubscribeToken(email);
  try {
    // Prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(token));
  } catch (error) {
    return false;
  }
};

module.exports = { generateUnsubscribeToken, verifyUnsubscribeToken };

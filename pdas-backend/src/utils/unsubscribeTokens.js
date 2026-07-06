const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "fallback_secret_for_hmac";
const VERSION = "v1";

const getEncryptionKey = () => crypto.createHash("sha256").update(SECRET).digest();

const encode = (value) => Buffer.from(value).toString("base64url");
const decode = (value) => Buffer.from(value, "base64url");
const sign = (value) => crypto.createHmac("sha256", SECRET).update(value).digest("base64url");

/**
 * Generates an opaque encrypted unsubscribe token containing the email address.
 * The email is intentionally not exposed in URLs.
 * @param {string} email
 * @returns {string} The encrypted token
 */
const generateUnsubscribeToken = (email) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const payload = JSON.stringify({
    v: VERSION,
    email: String(email || "").trim().toLowerCase(),
  });
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const envelope = [VERSION, encode(iv), encode(tag), encode(encrypted)].join(".");
  return `${envelope}.${sign(envelope)}`;
};

/**
 * Decrypts an opaque unsubscribe token.
 * @param {string} token
 * @returns {{email: string}|null}
 */
const decodeUnsubscribeToken = (token) => {
  if (!token) return null;
  const [version, ivPart, tagPart, encryptedPart, signature] = String(token).split(".");
  if (version !== VERSION || !ivPart || !tagPart || !encryptedPart || !signature) return null;

  try {
    const envelope = [version, ivPart, tagPart, encryptedPart].join(".");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign(envelope)))) {
      return null;
    }
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), decode(ivPart));
    decipher.setAuthTag(decode(tagPart));
    const decrypted = Buffer.concat([
      decipher.update(decode(encryptedPart)),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(decrypted);
    if (payload?.v !== VERSION || !payload.email) return null;
    return { email: String(payload.email).trim().toLowerCase() };
  } catch (error) {
    return null;
  }
};

const verifyLegacyUnsubscribeToken = (email, token) => {
  if (!email || !token) return false;
  const expectedToken = crypto.createHmac("sha256", SECRET).update(email.toLowerCase()).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(token));
  } catch (error) {
    return false;
  }
};

const verifyUnsubscribeToken = (email, token) => {
  const decoded = decodeUnsubscribeToken(token);
  if (decoded) {
    return decoded.email === String(email || "").trim().toLowerCase();
  }
  return verifyLegacyUnsubscribeToken(email, token);
};

module.exports = {
  decodeUnsubscribeToken,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
};

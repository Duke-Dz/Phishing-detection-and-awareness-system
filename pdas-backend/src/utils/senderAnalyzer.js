const SUSPICIOUS_REPLY_PATTERNS = [
  /reply\s+(?:with\s+)?(?:your\s+)?(?:password|pin|otp|passcode|card|account)/i,
  /send\s+(?:us\s+)?(?:your\s+)?(?:password|pin|otp|passcode|card|account)/i,
  /text\s+(?:back\s+)?(?:your\s+)?(?:password|pin|otp|passcode)/i,
];

/**
 * Describe the sender identifier without treating a country, phone-number
 * format, brand name, or ordinary sender ID as evidence of phishing.
 * Sender legitimacy requires provider-backed verification that this local
 * scanner does not have.
 */
const analyzeSender = (sender) => {
  if (!sender) return { score: 0, signals: [], senderType: "unknown" };

  const normalized = String(sender).trim();
  const compact = normalized.replace(/[\s()-]/g, "");
  const isPhoneNumber = /^\+?\d{7,15}$/.test(compact);
  const isShortcode = /^\d{3,6}$/.test(compact);
  const isAlphanumericId = /^[a-z0-9][a-z0-9 ._-]{1,20}$/i.test(normalized);

  return {
    score: 0,
    signals: [],
    senderType: isShortcode
      ? "shortcode"
      : isPhoneNumber
        ? "phone_number"
        : isAlphanumericId
          ? "alphanumeric_id"
          : "unknown",
  };
};

const analyzeReplyBehaviour = (messageContent) => {
  const text = String(messageContent || "");
  const asksForSensitiveReply = SUSPICIOUS_REPLY_PATTERNS.some((pattern) => pattern.test(text));
  const signals = asksForSensitiveReply
    ? [{
      name: "sensitive_reply_request",
      points: 12,
      strength: "medium",
      category: "content",
      evidence: "Message asks for sensitive information in a reply",
    }]
    : [];

  return {
    score: asksForSensitiveReply ? 12 : 0,
    signals,
    supportsReply: asksForSensitiveReply,
    explicitlyNoReply: /do not reply|don'?t reply|this is an automated|do not respond/i.test(text),
  };
};

module.exports = { analyzeSender, analyzeReplyBehaviour };

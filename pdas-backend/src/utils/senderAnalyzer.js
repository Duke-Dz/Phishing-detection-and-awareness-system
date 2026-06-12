const KENYAN_LEGIT_SHORTCODES = {
  MPESA: "Safaricom M-Pesa",
  SAFARICOM: "Safaricom",
  EQUITY: "Equity Bank",
  KCB: "KCB Bank",
  COOPERATIVE: "Co-operative Bank",
  NCBA: "NCBA Bank",
  ABSA: "Absa Bank",
  STANCHART: "Standard Chartered",
  DTB: "Diamond Trust Bank",
  "22433": "Safaricom M-Pesa (shortcode)",
  "40300": "Equity Bank (shortcode)",
};

const SUSPICIOUS_REPLY_PATTERNS = [
  /reply\s+(yes|no|1|2|confirm|stop)/i,
  /text\s+(back|us|here)/i,
  /respond\s+to\s+this/i,
  /send\s+us\s+your/i,
];

const analyzeSender = (sender, messageContent) => {
  const signals = [];
  let score = 0;

  if (!sender) return { score: 0, signals, senderType: "unknown" };

  const senderUpper = sender.trim().toUpperCase();
  const matchedCode = Object.keys(KENYAN_LEGIT_SHORTCODES).find(
    (code) => senderUpper === code || senderUpper.includes(code),
  );
  const isKnownLegit = Boolean(matchedCode);

  if (isKnownLegit) {
    if (/password|pin|otp|verify.*account|login/i.test(messageContent)) {
      score += 40;
      signals.push({
        name: "legit_sender_suspicious_content",
        points: 40,
        evidence: `Sender "${sender}" appears legitimate but message asks for sensitive data — possible spoofing`,
      });
    }
    return {
      score,
      signals,
      senderType: "known_shortcode",
      senderName: KENYAN_LEGIT_SHORTCODES[matchedCode],
    };
  }

  const isPhoneNumber = /^(\+?254|0)[17]\d{8}$/.test(sender.replace(/\s/g, ""));
  if (isPhoneNumber) {
    score += 25;
    signals.push({
      name: "regular_number_sender",
      points: 25,
      evidence: `Message from regular phone number "${sender}" — legitimate banks use shortcodes, not personal numbers`,
    });
  }

  const claimsBrand = /mpesa|equity|kcb|safaricom|cooperative|ncba|absa/i.test(messageContent);
  if (claimsBrand && !isKnownLegit) {
    score += 35;
    signals.push({
      name: "brand_sender_mismatch",
      points: 35,
      evidence: `Message claims to be from a known bank/brand but sender "${sender}" is not a verified shortcode`,
    });
  }

  return {
    score: Math.min(100, score),
    signals,
    senderType: isPhoneNumber ? "phone_number" : "unknown",
  };
};

const analyzeReplyBehaviour = (messageContent) => {
  const signals = [];
  let score = 0;

  const encouragesReply = SUSPICIOUS_REPLY_PATTERNS.some((pattern) => pattern.test(messageContent));
  if (encouragesReply) {
    score += 20;
    signals.push({
      name: "suspicious_reply_request",
      points: 20,
      evidence: "Message asks you to reply to verify or confirm — legitimate banks never do this via SMS",
    });
  }

  const saysNoReply = /do not reply|don'?t reply|this is an automated|do not respond/i.test(messageContent);

  return {
    score,
    signals,
    supportsReply: encouragesReply,
    explicitlyNoReply: saysNoReply,
  };
};

module.exports = { analyzeSender, analyzeReplyBehaviour };

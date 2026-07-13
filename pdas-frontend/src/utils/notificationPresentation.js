const legacyScanPattern = /Your\s+(url|email|sms)\s+scan was classified as\s+(safe|suspicious|phishing)\s+with a risk score of\s+(\d+)/i;

const labels = { url: "URL", email: "Email", sms: "SMS" };

export const presentNotification = (item) => {
  if (item.title !== "Scan completed") return item;
  const match = String(item.message || "").match(legacyScanPattern);
  if (!match) return item;

  const [, rawType, rawVerdict, rawScore] = match;
  const scanType = labels[rawType.toLowerCase()] || "Content";
  const verdict = rawVerdict.toLowerCase();
  const score = Math.max(0, Math.min(100, Number(rawScore) || 0));
  const content = {
    safe: {
      title: `${scanType} scan: no strong threats detected`,
      message: `Risk score ${score}/100. No strong known warning signs were found. Continue with normal caution.`,
    },
    suspicious: {
      title: `${scanType} scan needs your review`,
      message: `Risk score ${score}/100. Suspicious indicators were found. Verify the sender or destination before taking action.`,
    },
    phishing: {
      title: `Phishing warning from ${scanType} scan`,
      message: `Risk score ${score}/100. Do not click links, reply, or provide passwords, OTPs, or payment details.`,
    },
  }[verdict];

  return { ...item, ...content };
};

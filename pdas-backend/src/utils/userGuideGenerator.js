const SIGNAL_MESSAGES = {
  urgency_pressure: "Creates panic by claiming your account is compromised",
  asks_for_sensitive_data: "Asks you to provide sensitive personal information",
  contains_link: "Contains a link; verify it before opening",
  missing_https: "The link does not use HTTPS",
  embedded_url_missing_https: "An embedded link does not use HTTPS",
  phishing_language: "Uses language commonly found in phishing messages",
  embedded_url_financial_keyword_domain: "The link domain mimics a financial service",
  kenyan_impersonation: "Claims to be from a known Kenyan organization",
  brand_sender_mismatch: "The claimed brand does not match the sender",
  regular_number_sender: "Sent from a regular number instead of a registered shortcode",
  suspicious_reply_request: "Asks for a reply containing potentially sensitive information",
  legit_sender_suspicious_content: "The sender looks legitimate but the content is suspicious",
};

const titleFor = (scanType, classification) => {
  if (classification === "phishing") return "High Risk: Phishing or Malware Detected";
  if (classification === "suspicious") return scanType === "url" ? "Suspicious Link" : "Suspicious Message";
  return scanType === "url" ? "Link appears safe" : "Message appears safe";
};

const summaryFor = (classification) => {
  if (classification === "phishing") return "We found strong indicators of malicious activity.";
  if (classification === "suspicious") return "We found indicators that require careful verification.";
  return "We did not detect strong phishing indicators, but you should remain cautious.";
};

const actionsFor = (classification) => {
  if (classification === "phishing") {
    return [
      "Do not open links, reply, or call numbers in the message",
      "Delete or quarantine the message",
      "If you interacted with it, change affected passwords immediately",
      "Contact the organization through its official website or app",
    ];
  }
  if (classification === "suspicious") {
    return [
      "Do not click links or reply until you verify the sender",
      "Contact the organization through an official channel",
      "Do not provide personal, financial, or authentication information",
    ];
  }
  return ["Stay alert and verify unexpected requests through an official channel"];
};

const fromLegacyDetails = (details = {}) => {
  const flags = [
    ...(details.sms_red_flags || []),
    ...(details.auth_failures || []),
    ...(details.rules_matched || []),
  ];
  if (details.is_blacklisted) flags.unshift("The destination was blacklisted by a trusted threat source");
  if (details.has_credential_harvester) flags.push("The page contains a suspected credential harvester");
  return [...new Set(flags)];
};

const buildGuide = ({ scanType, classification, signals = [], details = {}, senderAnalysis, replyAnalysis }) => {
  const redFlags = fromLegacyDetails(details);
  for (const signal of Array.isArray(signals) ? signals : []) {
    const message = SIGNAL_MESSAGES[signal?.name] || signal?.evidence;
    if (message && !redFlags.includes(message)) redFlags.push(message);
  }

  const verificationSteps = [
    "Use the official app or type the organization's website address yourself",
    "Contact the organization using a number from an official source",
  ];
  if (senderAnalysis?.senderType === "phone_number") {
    verificationSteps.push("Confirm why an organization is contacting you from a regular phone number");
  }
  if (senderAnalysis?.senderType === "known_shortcode") {
    verificationSteps.push(`The sender ${senderAnalysis.senderName} is recognized, but the content still needs to be credible`);
  }
  if (replyAnalysis?.explicitlyNoReply) {
    verificationSteps.push("A no-reply notice is normal for automated messages but is not proof of legitimacy");
  }

  const title = titleFor(scanType, classification);
  const summary = summaryFor(classification);
  const actions = actionsFor(classification);
  return {
    title,
    summary,
    verdict: summary,
    redFlags,
    red_flags: redFlags,
    actions,
    what_to_do: actions,
    how_to_verify: verificationSteps,
  };
};

const generateUserGuide = (...args) => {
  if (["url", "email", "sms"].includes(args[0])) {
    const [scanType, classification, _score, details = {}] = args;
    return buildGuide({ scanType, classification, details });
  }
  const [classification, signals = [], senderAnalysis = null, replyAnalysis = null] = args;
  return buildGuide({
    scanType: senderAnalysis ? "sms" : "email",
    classification,
    signals,
    senderAnalysis,
    replyAnalysis,
  });
};

module.exports = { buildGuide, generateUserGuide };

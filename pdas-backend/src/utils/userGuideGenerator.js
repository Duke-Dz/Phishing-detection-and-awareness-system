const SIGNAL_MESSAGES = {
  urgency_pressure: "Creates panic by claiming your account is compromised",
  asks_for_sensitive_data: "Asks you to provide sensitive personal information",
  contains_link: "Contains a link — always verify before clicking",
  missing_https: "The link is not secure (doesn't use HTTPS)",
  embedded_url_missing_https: "The link is not secure (doesn't use HTTPS)",
  phishing_language: "Uses language commonly found in phishing messages",
  embedded_url_financial_keyword_domain: "The link domain mimics a bank or financial service",
  kenyan_impersonation: "Claims to be from a known Kenyan organisation",
  brand_sender_mismatch: "Claims to be from a bank but sender is not a verified shortcode",
  regular_number_sender: "Sent from a regular phone number, not a bank shortcode",
  suspicious_reply_request: "Asks you to reply — legitimate banks never ask this via SMS",
  legit_sender_suspicious_content: "Sender looks legitimate but the message content is suspicious",
};

const generateUserGuide = (classification, signals, senderAnalysis = null, replyAnalysis = null) => {
  const redFlags = [];
  const actions = [];
  const verificationSteps = [];

  signals.forEach((signal) => {
    const msg = SIGNAL_MESSAGES[signal.name];
    if (msg && !redFlags.includes(msg)) redFlags.push(msg);
  });

  if (classification === "phishing") {
    actions.push(
      "Do NOT click any links in this message",
      "Do NOT reply to this message",
      "Do NOT call any number mentioned in the message",
      "Delete this message immediately",
      "If you already clicked a link, change your passwords immediately",
      "Contact your bank using the official number on the back of your card",
    );
    verificationSteps.push(
      "Call your bank's official helpline to confirm if they sent this",
      "Log in to your bank directly through the official app, not through any link",
      "Check if the sender matches your bank's known shortcode",
      "Forward suspicious messages to your carrier (e.g., 333 on Safaricom)",
    );
  } else if (classification === "suspicious") {
    actions.push(
      "Be cautious — do not click any links until you verify",
      "Contact your bank or organisation directly to confirm",
      "Do not provide any personal information",
    );
    verificationSteps.push(
      "Call your bank using the number on the back of your card",
      "Check the sender — legitimate banks use registered shortcodes",
      "Visit your bank's official website directly, not through this link",
    );
  } else {
    actions.push("This message appears safe, but always stay alert");
    verificationSteps.push("If unsure, verify by contacting the organisation directly");
  }

  if (senderAnalysis?.senderType === "phone_number") {
    verificationSteps.push(
      "This message came from a regular phone number — real banks use official shortcodes like MPESA, EQUITY, or KCB",
      "You can reply to this number to test — legitimate bank shortcodes do not accept replies",
    );
  }

  if (senderAnalysis?.senderType === "known_shortcode") {
    verificationSteps.push(
      `Sender "${senderAnalysis.senderName}" is a known shortcode — but still verify the message content matches normal communications`,
    );
  }

  if (replyAnalysis?.explicitlyNoReply) {
    verificationSteps.push(
      "This message says not to reply — that is typical of legitimate automated bank messages",
    );
  }

  const verdict = classification === "phishing"
    ? "This message shows strong signs of being a phishing attempt"
    : classification === "suspicious"
      ? "This message has suspicious characteristics — proceed with caution"
      : "This message appears legitimate";

  return {
    verdict,
    red_flags: redFlags,
    what_to_do: actions,
    how_to_verify: verificationSteps,
    no_reply_note:
      "Legitimate organisations like banks and telecoms send automated messages that do not accept replies. If you can reply and get a response, the sender may not be who they claim.",
  };
};

module.exports = { generateUserGuide };

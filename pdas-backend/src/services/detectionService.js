/**
 * @module detectionService
 * @description Core phishing detection engine — 4-layer defence-in-depth architecture.
 *
 * Layer 1: Rule-based signal checks (fast, runs first)
 * Layer 2: External threat intelligence / blacklist lookups
 * Layer 3: Deterministic contextual feature scoring
 * Layer 4: Heuristic content analysis (page-level, for URLs)
 *
 * Layer scores are combined with evidence-tier gates so weak-only signals
 * cannot assert phishing and confirmed reputation evidence cannot be averaged down.
 */

const { extractDomain, lookupDomain } = require("./threatIntelService");
const { checkExternalSources } = require("./externalThreatService");
const { checkTyposquatting } = require("./typosquattingService");
const { checkAtTrick, checkSubdomainImpersonation, checkExcessiveSubdomains } = require("./urlTricksService");
const { checkDisplayNameSpoofing, checkEmbeddedLinkMismatch } = require("./emailAuthService");
const { extractUrlFeatures, extractMessageFeatures, scoreUrlFeatures, scoreMessageFeatures } = require("./mlScorerService");
const { expandShortUrl, followRedirects, analyzePageContent } = require("./contentAnalysisService");
const { analyzeSender, analyzeReplyBehaviour } = require("../utils/senderAnalyzer");
const { parseRawEmail, extractAuthHeaders } = require("../utils/emailParser");
const { generateUserGuide } = require("../utils/userGuideGenerator");
const { ENGINE_VERSION } = require("./detectionConstants");
const logger = require("../utils/logger");

// ── Constants ──────────────────────────────────────────────────────────

const LAYER_WEIGHTS = {
  rules: 0.35,
  blacklist: 0.30,
  ml: 0.25,
  content: 0.10,
};

const MESSAGE_LAYER_WEIGHTS = {
  rules: 0.40,
  blacklist: 0.33,
  ml: 0.27,
};

const financialDomainKeywords = [
  "bank", "secure", "login", "verify", "account", "wallet",
  "payment", "paypal", "update", "confirm",
];

const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "rb.gy", "shorturl.at", "cutt.ly", "tiny.cc"];
const riskyTlds = [".zip", ".mov", ".xyz", ".top", ".click", ".loan", ".work", ".tk", ".ml", ".ga", ".cf"];
const DANGEROUS_ATTACHMENT_EXTENSIONS = new Set([
  "exe", "scr", "com", "pif", "msi", "bat", "cmd", "ps1", "js", "jse",
  "vbs", "vbe", "wsf", "hta", "lnk", "iso", "img", "jar", "apk",
]);
const MACRO_ATTACHMENT_EXTENSIONS = new Set(["docm", "xlsm", "pptm"]);
const DANGEROUS_ATTACHMENT_TYPES = new Set([
  "application/x-msdownload", "application/x-dosexec", "application/x-msdos-program",
  "application/x-sh", "application/x-powershell", "text/x-script", "application/java-archive",
]);
const HIGH_VALUE_EMBEDDED_URL_SIGNALS = new Set([
  "ip_address_domain", "typosquatting", "at_trick", "subdomain_impersonation",
  "financial_keyword_domain",
]);
const MAX_EMBEDDED_URL_CHECKS = 200;

// ── Helpers ────────────────────────────────────────────────────────────

const classify = (score) => {
  if (score >= 61) return "phishing";
  if (score >= 31) return "suspicious";
  return "safe";
};

const inferSignalStrength = (points) => {
  if (points >= 30) return "strong";
  if (points >= 10) return "medium";
  if (points > 0) return "weak";
  return "informational";
};

const addSignal = (signals, name, points, evidence, metadata = {}) => {
  const category = metadata.category || "general";
  signals.push({
    name,
    points,
    evidence,
    strength: metadata.strength || inferSignalStrength(points),
    category,
    // Signals derived from the same underlying observation share a family so
    // they cannot manufacture corroboration merely by being expressed twice.
    family: metadata.family || category,
  });
};

const scoreSignals = (signals, maxExpected) => {
  const rawPoints = signals.reduce((total, s) => total + s.points, 0);
  return Math.min(100, Math.round(rawPoints));
};

const summarizeEvidence = (signals = []) => {
  const scoreable = signals.filter((signal) => Number(signal.points || 0) > 0);
  const categories = new Set(scoreable.map((signal) => signal.category || "general"));
  const strongFamilies = new Set(
    scoreable
      .filter((signal) => signal.strength === "strong")
      .map((signal) => signal.family || signal.category || "general"),
  );
  const corroboratedFamilies = new Set(
    scoreable
      .filter((signal) => ["strong", "medium"].includes(signal.strength))
      .map((signal) => signal.family || signal.category || "general"),
  );

  return {
    strongSignalCount: scoreable.filter((signal) => signal.strength === "strong").length,
    // Keep the existing field names for computeMessageScore callers, but make
    // their semantics independent evidence rather than raw signal count.
    strongCount: strongFamilies.size,
    mediumCount: scoreable.filter((signal) => signal.strength === "medium").length,
    weakCount: scoreable.filter((signal) => signal.strength === "weak").length,
    categoryCount: categories.size,
    strongCategoryCount: strongFamilies.size,
    corroboratedCategoryCount: corroboratedFamilies.size,
    strongFamilyCount: strongFamilies.size,
    corroboratedFamilyCount: corroboratedFamilies.size,
  };
};

/**
 * Compute weighted final score from individual layer scores.
 * @param {{ rules: number, blacklist: number, ml: number, content: number }} layerScores
 * @returns {number} 0-100 weighted score
 */
const hasConfirmedThreatIntel = (threatIntel) => {
  if (!threatIntel?.is_blacklisted) return false;
  return ["phishing", "social_engineering", "malware", "credential_theft"].includes(
    String(threatIntel.threat_type || "").toLowerCase(),
  );
};

/**
 * Preserve decisive URL evidence after layer weighting. External no-match
 * results add no signal and therefore cannot lower or raise the verdict.
 * Independent strong evidence families are required for a phishing verdict.
 */
const applyUrlEvidenceGates = (weightedScore, signals = [], threatIntel = null) => {
  if (hasConfirmedThreatIntel(threatIntel)) {
    return { score: Math.max(70, weightedScore), reason: "blacklist_confirmed" };
  }

  const strongFamilies = new Set(
    signals
      .filter((signal) => signal.strength === "strong" && Number(signal.points || 0) > 0)
      .map((signal) => signal.family || signal.category || "general"),
  );

  if (strongFamilies.size >= 2) {
    return { score: Math.max(65, weightedScore), reason: "corroborated_strong_evidence" };
  }
  if (strongFamilies.size === 1) {
    return { score: Math.max(31, weightedScore), reason: "single_strong_signal_review" };
  }
  return { score: weightedScore, reason: "weighted_average" };
};

const computeFinalScore = (
  layerScores,
  layerWeights = LAYER_WEIGHTS,
  activeLayers = Object.keys(layerWeights),
  threatIntel = null,
) => {
  if (hasConfirmedThreatIntel(threatIntel) || layerScores.blacklist >= 80) {
    const confirmedScore = Math.round(
      ((layerScores.rules || 0) * 0.25) +
      ((layerScores.blacklist || 0) * 0.50) +
      ((layerScores.ml || 0) * 0.25),
    );
    return Math.max(70, Math.min(100, confirmedScore));
  }

  const activeWeight = activeLayers.reduce((sum, layer) => sum + (layerWeights[layer] || 0), 0);
  if (activeWeight <= 0) return 0;

  const weighted = activeLayers.reduce((sum, layer) => {
    const redistributedWeight = (layerWeights[layer] || 0) / activeWeight;
    return sum + (layerScores[layer] || 0) * redistributedWeight;
  }, 0);

  return Math.min(100, Math.round(weighted));
};

const getEffectiveWeights = (layerWeights, activeLayers) => {
  const activeWeight = activeLayers.reduce((sum, layer) => sum + (layerWeights[layer] || 0), 0);
  return Object.fromEntries(
    Object.keys(layerWeights).map((layer) => [
      layer,
      activeLayers.includes(layer) && activeWeight > 0
        ? Number(((layerWeights[layer] || 0) / activeWeight).toFixed(2))
        : 0,
    ]),
  );
};

const SCORING_WEIGHTS = {
  blacklist_confirmed: { rules: 0.50, blacklist: 0.35, ml: 0.15 },
  blacklist_neutral: { rules: 0.60, ml: 0.40 },
  weighted_average: MESSAGE_LAYER_WEIGHTS,
};

/**
 * Compute final SMS/email score with rules escalation and blacklist-neutral redistribution.
 * @returns {{ score: number, reason: string, effectiveWeights: object }}
 */
const computeMessageScore = (
  rulesScore,
  blacklistScore,
  mlScore,
  threatIntel = null,
  evidenceSummary = null,
) => {
  if (hasConfirmedThreatIntel(threatIntel) || blacklistScore >= 80) {
    const weights = SCORING_WEIGHTS.blacklist_confirmed;
    const score = Math.round(
      (rulesScore * weights.rules) + (blacklistScore * weights.blacklist) + (mlScore * weights.ml),
    );
    return {
      score: Math.max(70, Math.min(100, score)),
      reason: "blacklist_confirmed",
      effectiveWeights: { ...weights, content: 0 },
    };
  }

  const weights = blacklistScore === 0
    ? SCORING_WEIGHTS.blacklist_neutral
    : SCORING_WEIGHTS.weighted_average;
  let score = Math.round(
    (rulesScore * weights.rules)
      + (blacklistScore * (weights.blacklist || 0))
      + (mlScore * weights.ml),
  );
  let reason = blacklistScore === 0 ? "blacklist_neutral" : "weighted_average";

  if (evidenceSummary) {
    const {
      strongCount = 0,
      corroboratedCategoryCount = 0,
    } = evidenceSummary;

    // Content-only lexical, formatting, or marketing evidence cannot cross
    // into a warning verdict without at least one strong indicator.
    if (strongCount === 0) {
      score = Math.min(score, 30);
      reason = "weak_evidence_cap";
    }

    // One meaningful signal merits review but cannot alone assert phishing.
    if (strongCount === 1 && corroboratedCategoryCount < 2) {
      score = Math.max(31, Math.min(score, 60));
      reason = "single_signal_review";
    }

    // Independent strong evidence, or a decisive rule such as an executable
    // attachment, can cross the phishing threshold without a blacklist hit.
    if (strongCount >= 2 || (rulesScore >= 65 && strongCount >= 1)) {
      score = Math.max(65, score);
      reason = "corroborated_strong_evidence";
    } else if (strongCount >= 1 && corroboratedCategoryCount >= 3) {
      // A strong indicator plus two independent supporting families (for
      // example, typosquatting + credential request + pressure) is meaningful
      // corroboration even when the supporting evidence is not decisive alone.
      score = Math.max(65, score);
      reason = "multi_family_corroboration";
    } else if (strongCount >= 1 && corroboratedCategoryCount >= 2) {
      score = Math.max(31, Math.min(score, 60));
      reason = "corroborated_review";
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reason,
    effectiveWeights: { ...weights, blacklist: weights.blacklist || 0, content: 0 },
  };
};

const topSignalReasons = (signals, limit = 5) =>
  signals
    .filter((signal) => Number(signal.points || 0) > 0)
    .slice()
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, limit)
    .map((signal) => signal.evidence || signal.name)
    .filter(Boolean);

const scoreBand = (score) => {
  if (score >= 80) return "critical";
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
};

const buildScoringMetadata = ({
  layerScores,
  effectiveWeights,
  signals,
  riskScore,
  classification,
  reason = "weighted_average",
}) => ({
  method: "explainable_weighted_evidence",
  reason,
  final_score: riskScore,
  final_band: scoreBand(riskScore),
  classification,
  layer_scores: Object.fromEntries(
    Object.entries(layerScores).map(([layer, score]) => [
      layer,
      { score, band: scoreBand(score), weight: effectiveWeights[layer] || 0 },
    ]),
  ),
  top_evidence: signals
    .filter((signal) => Number(signal.points || 0) > 0)
    .slice()
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5)
    .map((signal) => ({
      name: signal.name,
      points: signal.points || 0,
      evidence: signal.evidence || signal.name,
    })),
});

const buildUserFeedback = ({ classification, riskScore, signals, scanType }) => {
  const reasons = topSignalReasons(signals);
  const confidence = riskScore >= 80
    ? "high"
    : riskScore >= 50
      ? "medium"
      : "low";

  if (classification === "phishing") {
    return {
      verdict: scanType === "url"
        ? "This URL shows strong signs of phishing or abuse."
        : "This message shows strong signs of phishing.",
      confidence,
      reasons,
      recommended_action: "Do not click links, submit credentials, reply, or call numbers from this content.",
      verification_steps: [
        "Open the official website or app directly instead of using this link.",
        "Contact the organisation using a verified phone number or official support channel.",
        "Report the content to your security/admin team or mobile provider.",
      ],
    };
  }

  if (classification === "suspicious") {
    return {
      verdict: scanType === "url"
        ? "This URL has suspicious indicators and should be verified first."
        : "This message has suspicious indicators and should be verified first.",
      confidence,
      reasons,
      recommended_action: "Pause and verify through an official channel before taking action.",
      verification_steps: [
        "Check the real domain carefully for misspellings or unusual subdomains.",
        "Avoid entering passwords, one-time codes, card details, or mobile-money PINs from this content.",
        "Ask the claimed sender through a trusted channel if the request is legitimate.",
      ],
    };
  }

  return {
    verdict: scanType === "url"
      ? "No strong phishing indicators were detected for this URL."
      : "No strong phishing indicators were detected in this message.",
    confidence,
    reasons,
    recommended_action: "Continue with normal caution; no automated scanner can guarantee safety.",
    verification_steps: [
      "Confirm the sender and domain match the organisation you expected.",
      "Be cautious if the page asks for passwords, OTPs, payment details, or urgent action.",
    ],
  };
};

// ════════════════════════════════════════════════════════════════════════
//  LAYER 1: Rule-Based Detection
// ════════════════════════════════════════════════════════════════════════

/**
 * Run all Layer 1 rule-based checks for a URL.
 * @param {string} url - The URL to analyse
 * @param {string} domain - Extracted domain
 * @returns {{ score: number, signals: object[] }}
 */
const runUrlRules = (url, domain) => {
  const signals = [];

  // Baseline URL checks
  if (!url.startsWith("https://")) {
    addSignal(signals, "missing_https", 4, "URL does not use HTTPS", { strength: "weak", category: "transport" });
  }

  if (shorteners.includes(domain)) {
    addSignal(signals, "url_shortener", 6, "URL uses a known shortening service", { strength: "weak", category: "link" });
  }

  if (riskyTlds.some((tld) => domain.endsWith(tld))) {
    addSignal(signals, "risky_tld", 5, "Domain uses a frequently abused top-level domain", { strength: "weak", category: "link" });
  }

  if (/\d+\.\d+\.\d+\.\d+/.test(domain)) {
    addSignal(signals, "ip_address_domain", 30, "URL uses an IP address instead of a domain", { strength: "strong", category: "link" });
  }

  if (domain.includes("xn--") || domain.replace(/-/g, "").length < domain.length - 2) {
    addSignal(signals, "suspicious_domain_shape", 6, "Domain contains unusual characters", { strength: "weak", category: "link" });
  }

  // ── Keyword scanning ──
  const financialMatches = financialDomainKeywords.filter((keyword) => domain.includes(keyword));
  if (financialMatches.length >= 2) {
    addSignal(
      signals,
      "financial_keyword_domain",
      12,
      `Domain contains multiple financial/security terms: ${financialMatches.slice(0, 4).join(", ")}`,
      { strength: "medium", category: "link" },
    );
  }

  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount >= 2 && financialMatches.length > 0) {
    addSignal(
      signals,
      "hyphenated_security_domain",
      5,
      `Domain contains ${hyphenCount} hyphens with security-style wording`,
      { strength: "weak", category: "link" },
    );
  }

  // Typosquatting detection
  const typosquat = checkTyposquatting(domain);
  if (typosquat.isTyposquat) {
    const attackLabel = {
      character_substitution: "Character substitution",
      brand_impersonation: "Brand impersonation",
      typosquatting: "Typosquatting",
    }[typosquat.attackType] || "Typosquatting";
    const distanceText = Number.isFinite(typosquat.editDistance)
      ? ` (edit distance: ${typosquat.editDistance})`
      : "";
    addSignal(
      signals,
      "typosquatting",
      35,
      `${attackLabel}: domain "${domain}" impersonates "${typosquat.matchedBrand}"${distanceText}`,
      { strength: "strong", category: "identity" },
    );
  }

  // Userinfo abuse detection
  const atTrick = checkAtTrick(url);
  if (atTrick.detected) {
    addSignal(
      signals,
      "at_trick",
      40,
      `URL uses @ trick: appears as "${atTrick.fakeDomain}" but navigates to "${atTrick.realDomain}"`,
      { strength: "strong", category: "link" },
    );
  }

  // Subdomain impersonation
  const subImpersonation = checkSubdomainImpersonation(url);
  if (subImpersonation.detected) {
    addSignal(
      signals,
      "subdomain_impersonation",
      35,
      `Brand "${subImpersonation.impersonatedBrand}" used as subdomain of "${subImpersonation.actualDomain}"`,
      { strength: "strong", category: "identity" },
    );
  }

  // Excessive subdomains
  const excessiveSubs = checkExcessiveSubdomains(url);
  if (excessiveSubs.detected) {
    addSignal(
      signals,
      "excessive_subdomains",
      5,
      `Domain has ${excessiveSubs.subdomainCount} subdomain levels (suspicious nesting)`,
      { strength: "weak", category: "link" },
    );
  }

  return { score: scoreSignals(signals, 150), signals };
};

const cleanUrl = (value) => String(value || "")
  .trim()
  .replace(/&amp;/gi, "&")
  .replace(/[),.;!?\]}>"']+$/g, "");

const extractMessageUrls = (text) => [
  ...new Set((String(text || "").match(/https?:\/\/[^\s<>"']+/gi) || []).map(cleanUrl).filter(Boolean)),
];

const extractAddressDomain = (value) => {
  const match = String(value || "").match(/@([^>\s,;]+)/);
  return match ? match[1].replace(/[>"']+$/g, "").toLowerCase() : "";
};

const relatedDomains = (left, right) => Boolean(left && right) && (
  left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`)
);

const AUTH_VERDICTS = new Set([
  "pass", "fail", "softfail", "neutral", "none", "temperror", "permerror", "policy", "missing",
]);

const normalizeAuthVerdict = (value) => {
  const verdict = String(value || "missing").toLowerCase();
  return AUTH_VERDICTS.has(verdict) ? verdict : "missing";
};

const buildAuthenticationContext = (parsed, trustedAuthentication = null) => {
  if (!parsed?.isRawEmail) {
    return {
      source: "unavailable",
      trusted: false,
      authserv_id: null,
      spf: null,
      dkim: null,
      dmarc: null,
    };
  }

  const authenticationHeaders = parsed.headerValues?.["authentication-results"]?.length
    ? parsed.headerValues["authentication-results"]
    : [parsed.headers?.["authentication-results"]].filter(Boolean);
  const selected = authenticationHeaders.length > 0
    ? String(authenticationHeaders[0])
    : "";
  const reportedAuthservId = (selected.match(/^\s*([^\s;]+)/)?.[1] || "").toLowerCase();
  const results = extractAuthHeaders({ "authentication-results": selected });

  // Authentication-Results inside an uploaded .eml file is caller-controlled.
  // Only an internal, server-controlled ingress may supply trusted verdicts
  // separately from the message bytes.
  if (trustedAuthentication && typeof trustedAuthentication === "object") {
    return {
      source: "trusted_server_ingress",
      trusted: true,
      authserv_id: String(trustedAuthentication.authserv_id || "").toLowerCase() || null,
      spf: normalizeAuthVerdict(trustedAuthentication.spf),
      dkim: normalizeAuthVerdict(trustedAuthentication.dkim),
      dmarc: normalizeAuthVerdict(trustedAuthentication.dmarc),
    };
  }

  return {
    source: selected ? "reported_untrusted_header" : "unavailable",
    trusted: false,
    authserv_id: reportedAuthservId || null,
    spf: results.spf,
    dkim: results.dkim,
    dmarc: results.dmarc,
  };
};

const decodeRfc822DataUrl = (value) => {
  if (typeof value !== "string") return null;
  const match = /^data:message\/rfc822;base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(value.trim());
  if (!match) return null;

  const payload = match[1].replace(/\s/g, "");
  if (!payload || payload.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) {
    return null;
  }
  return Buffer.from(payload, "base64");
};

const prepareMessageInput = (content, scanType, options = {}) => {
  const original = Buffer.isBuffer(content)
    ? content.toString("latin1")
    : String(content || "");
  if (scanType !== "email") {
    return {
      original,
      analysisText: original,
      modelText: original,
      html: "",
      urls: extractMessageUrls(original),
      from: "",
      replyTo: "",
      attachments: [],
      inputMode: "plain_text",
      authentication: buildAuthenticationContext(null),
    };
  }

  const uploadedBuffer = decodeRfc822DataUrl(original);
  const emailSource = uploadedBuffer || content;
  const parsed = parseRawEmail(emailSource);
  if (!parsed.isRawEmail) {
    const plainOriginal = uploadedBuffer ? parsed.body : original;
    const from = plainOriginal.match(/^from:\s*(.+)$/im)?.[1]?.trim() || "";
    const urls = parsed.urls?.length ? parsed.urls.map(cleanUrl) : extractMessageUrls(plainOriginal);
    return {
      original: plainOriginal,
      analysisText: parsed.normalizedText || plainOriginal,
      modelText: `${parsed.normalizedText || plainOriginal}\n${urls.join("\n")}`.trim(),
      html: /<a\s/i.test(plainOriginal) ? plainOriginal : "",
      urls: [...new Set(urls.filter(Boolean))],
      from,
      replyTo: "",
      attachments: [],
      inputMode: uploadedBuffer ? "uploaded_text_bytes" : "plain_text",
      authentication: buildAuthenticationContext(null),
    };
  }

  const urls = [...new Set((parsed.urls || []).map(cleanUrl).filter(Boolean))];
  const analysisText = [parsed.subject ? `Subject: ${parsed.subject}` : "", parsed.normalizedText]
    .filter(Boolean)
    .join("\n");
  return {
    original,
    analysisText,
    modelText: `${analysisText}\n${urls.join("\n")}`.trim(),
    html: parsed.htmlBody || "",
    urls,
    from: parsed.from || "",
    replyTo: parsed.headers?.["reply-to"] || "",
    attachments: parsed.attachments || [],
    inputMode: uploadedBuffer ? "rfc5322_bytes" : "rfc5322",
    authentication: buildAuthenticationContext(parsed, options.trustedAuthentication),
  };
};

/**
 * Run all Layer 1 rule-based checks for an email/SMS message.
 * @param {string} text - The message content
 * @param {string} scanType - "email" or "sms"
 * @returns {{ score: number, signals: object[] }}
 */
const runMessageRules = (text, scanType, context = {}) => {
  const signals = [];

  // ── Phishing language keywords ──

  // ── Contains links ──

  // ── Sensitive data requests ──

  // ── Urgency/fear tactics ──

  // ── Email-specific checks ──
  if (scanType !== "email") return { score: 0, signals };

  const authentication = context.authentication || {};
  const trustedAuthentication = authentication.trusted === true;
  const dmarcFailed = trustedAuthentication && authentication.dmarc === "fail";
  const spfFailed = trustedAuthentication && ["fail", "softfail"].includes(authentication.spf);
  const dkimFailed = trustedAuthentication && authentication.dkim === "fail";

  if (dmarcFailed) {
    addSignal(signals, "dmarc_fail", 24, "Trusted receiver reports DMARC alignment failure", {
      strength: "medium",
      category: "authentication",
    });
  }
  if (spfFailed && dkimFailed) {
    addSignal(signals, "spf_dkim_fail", 16, "Trusted receiver reports both SPF and DKIM failure", {
      strength: "medium",
      category: "authentication",
    });
  }

  const spoofResult = checkDisplayNameSpoofing(context.from || "");
  if (spoofResult.isSpoofed) {
    addSignal(
      signals,
      "display_name_domain_mismatch",
      18,
      `Display name claims "${spoofResult.claimedBrand}" but the From domain is "${spoofResult.actualDomain}"`,
      { strength: "medium", category: "identity", family: "brand_identity" },
    );
  }

  const fromDomain = extractAddressDomain(context.from);
  const replyDomain = extractAddressDomain(context.replyTo);
  if (fromDomain && replyDomain && !relatedDomains(fromDomain, replyDomain)) {
    addSignal(
      signals,
      "reply_to_domain_mismatch",
      14,
      `Replies go to "${replyDomain}" instead of the From domain "${fromDomain}"`,
      { strength: "medium", category: "identity" },
    );
  }

  const linkMismatch = checkEmbeddedLinkMismatch(context.html || "");
  if (linkMismatch.hasMismatch) {
    addSignal(
      signals,
      "link_text_domain_mismatch",
      18,
      `Visible link text points to a different domain (${linkMismatch.mismatches.length} mismatch${linkMismatch.mismatches.length > 1 ? "es" : ""})`,
      { strength: "medium", category: "link" },
    );
  }

  if (dmarcFailed && linkMismatch.hasMismatch) {
    addSignal(
      signals,
      "authentication_link_corroboration",
      30,
      "DMARC alignment failure is corroborated by a deceptive link-domain mismatch",
      { strength: "strong", category: "corroboration" },
    );
  }

  for (const attachment of context.attachments || []) {
    const filename = String(attachment.filename || "unnamed attachment");
    const extension = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "";
    const contentType = String(attachment.contentType || "").toLowerCase();
    if (DANGEROUS_ATTACHMENT_EXTENSIONS.has(extension) || DANGEROUS_ATTACHMENT_TYPES.has(contentType)) {
      addSignal(
        signals,
        "dangerous_attachment",
        70,
        `Attachment "${filename}" has an executable or script file type`,
        { strength: "strong", category: "attachment" },
      );
    } else if (MACRO_ATTACHMENT_EXTENSIONS.has(extension)) {
      addSignal(
        signals,
        "macro_enabled_attachment",
        24,
        `Attachment "${filename}" is a macro-enabled document and requires review`,
        { strength: "medium", category: "attachment" },
      );
    }
  }

  return { score: scoreSignals(signals, 150), signals };
};

// ════════════════════════════════════════════════════════════════════════
//  LAYER 2: Blacklist / Threat Intelligence
// ════════════════════════════════════════════════════════════════════════

/**
 * Run Layer 2 blacklist and external threat intelligence checks.
 * @param {string} url - The full URL
 * @param {string} domain - Extracted domain
 * @returns {Promise<{ score: number, signals: object[], threatIntel: object|null, externalApiUsage: object[] }>}
 */
const runBlacklistChecks = async (url, domain, options = {}) => {
  const signals = [];
  let threatIntel = null;
  let externalApiUsage = [];

  // ── Internal blacklist (database + built-in) ──
  const internalResult = await lookupDomain(domain);
  if (internalResult?.is_blacklisted) {
    addSignal(
      signals,
      "blacklisted_domain",
      50,
      `Flagged by ${(internalResult.blacklist_sources || []).join(", ") || "threat intelligence"}`,
    );
    threatIntel = {
      domain: internalResult.domain,
      reputation_score: internalResult.reputation_score,
      is_blacklisted: internalResult.is_blacklisted,
      threat_type: internalResult.threat_type,
    };
  }

  // ── External API checks (Google Safe Browsing, etc.) ──
  try {
    const externalResult = await checkExternalSources(url, domain, {
      localScore: options.localScore || 0,
      internalThreatIntel: threatIntel,
    });
    externalApiUsage = externalResult.usage || [];
    const failedPrimaryReputation = externalResult.sources.find((source) => (
      source.source === "google_safe_browsing" && source.status === "failed"
    ));
    if (failedPrimaryReputation) {
      addSignal(
        signals,
        "reputation_coverage_failed",
        31,
        `Google Safe Browsing could not check this full URL (${failedPrimaryReputation.reason || "request failed"})`,
        { strength: "strong", category: "coverage", family: "coverage" },
      );
    }
    if (externalResult.isMalicious) {
      const sources = externalResult.sources
        .filter((s) => s.isMalicious)
        .map((s) => s.source);
      addSignal(
        signals,
        "external_blacklist",
        40,
        `Flagged by external source(s): ${sources.join(", ")}`,
      );
      if (!threatIntel) {
        threatIntel = {
          domain,
          reputation_score: externalResult.aggregateScore,
          is_blacklisted: true,
          threat_type: externalResult.sources.find((s) => s.isMalicious)?.threatType || "unknown",
        };
      }
    }
  } catch (error) {
    logger.warn(`External threat check failed for ${domain}: ${error.message}`);
  }

  const signalScore = scoreSignals(signals, 90);
  const reputationScore = threatIntel?.is_blacklisted
    ? Number(threatIntel.reputation_score || 0)
    : 0;

  return { score: Math.max(signalScore, reputationScore), signals, threatIntel, externalApiUsage };
};

// ════════════════════════════════════════════════════════════════════════
//  LAYER 3: Deterministic Contextual Feature Scoring
// ════════════════════════════════════════════════════════════════════════

/**
 * Run Layer 3 deterministic feature extraction and scoring for a URL.
 * @param {string} url - The URL to analyse
 * @returns {{ score: number, features: object }}
 */
const runUrlMlScoring = (url) => {
  try {
    const features = extractUrlFeatures(url);
    const score = scoreUrlFeatures(features);
    return { score, features };
  } catch (error) {
    logger.warn(`URL feature scoring failed: ${error.message}`);
    return { score: 0, features: {} };
  }
};

/**
 * Run Layer 3 contextual feature extraction and scoring for a message.
 * @param {string} text - The message content
 * @returns {{ score: number, features: object }}
 */
const MESSAGE_MODEL_EVIDENCE = {
  credentialRequest: [30, "Message explicitly asks for credentials or a security code", "medium", "content", "credential_action"],
  credentialRequestWithUrl: [20, "Credential request is paired with a link", "medium", "link_action", "credential_action"],
  paymentRequest: [24, "Message explicitly requests a payment or transfer", "medium", "financial_action", "financial_action"],
  urgencyWithSensitiveAction: [15, "Urgency is paired with a credential or payment request", "medium", "pressure", "pressure"],
  linkCallToAction: [8, "Message directs the reader to act through a link", "weak", "link_action", "link_action"],
  claimsCompromisedWithUrl: [15, "Account-compromise claim is paired with a link", "medium", "pressure", "pressure"],
  claimsPrizeWithUrl: [18, "Prize or reward claim is paired with a link", "weak", "scam_claim", "scam_claim"],
  hasHttpOnly: [4, "Message uses an unencrypted HTTP link", "weak", "transport", "transport"],
  hasSuspiciousDomain: [12, "Message contains a heavily hyphenated domain", "medium", "link", "link_shape"],
  highPressureFormatting: [5, "Urgency is combined with high-pressure formatting", "weak", "pressure", "pressure"],
};

const runMessageMlScoring = (text) => {
  try {
    const features = extractMessageFeatures(text);
    const score = scoreMessageFeatures(features);
    const signals = [];
    for (const [feature, [points, evidence, strength, category, family]] of Object.entries(MESSAGE_MODEL_EVIDENCE)) {
      if (features[feature]) {
        addSignal(signals, `context_${feature}`, points, evidence, { strength, category, family });
      }
    }
    return { score, features, signals };
  } catch (error) {
    logger.warn(`Message feature scoring failed: ${error.message}`);
    return { score: 0, features: {}, signals: [] };
  }
};

// ════════════════════════════════════════════════════════════════════════
//  LAYER 4: Heuristic Content Analysis (URLs only)
// ════════════════════════════════════════════════════════════════════════

/**
 * Run Layer 4 heuristic content analysis for a URL.
 * Follows redirects, expands shortened URLs, and analyses page content.
 * @param {string} url - The URL to analyse
 * @param {string} domain - Extracted domain
 * @returns {Promise<{ score: number, signals: object[], expandedUrl: string|null }>}
 */
const runContentAnalysis = async (url, domain) => {
  const signals = [];
  let expandedUrl = null;

  try {
    // ── Expand shortened URLs ──
    const shortResult = await expandShortUrl(url);
    if (shortResult.isShortened && shortResult.expandedUrl) {
      expandedUrl = shortResult.expandedUrl;
      const finalDomain = extractDomain(expandedUrl);
      
      if (riskyTlds.some((tld) => finalDomain.endsWith(tld))) {
        addSignal(
          signals,
          "shortener_hides_risky_tld",
          35,
          `Shortened URL hides a destination on a high-risk TLD (${finalDomain})`
        );
      } else {
        addSignal(
          signals,
          "shortened_url_expanded",
          5,
          `Shortened URL expands to: ${shortResult.expandedUrl}`
        );
      }
    }

    // ── Follow redirect chain ──
    const targetUrl = expandedUrl || url;
    const redirectResult = await followRedirects(targetUrl);

    if (redirectResult.hopCount >= 3) {
      const domains = redirectResult.chain ? redirectResult.chain.map(hop => extractDomain(hop.url)).filter(Boolean) : [];
      const uniqueDomains = new Set(domains);
      
      if (uniqueDomains.size >= 3) {
        addSignal(
          signals,
          "cross_domain_redirects",
          25,
          `URL redirects across ${uniqueDomains.size} different domains (suspicious evasion)`
        );
      } else {
        addSignal(
          signals,
          "excessive_redirects",
          15,
          `URL redirects ${redirectResult.hopCount} times before reaching final destination`
        );
      }
    }

    if (redirectResult.timedOut) {
      addSignal(
        signals,
        "redirect_timeout",
        5,
        "URL redirect chain timed out — could not reach final destination",
      );
    }

    // ── Page content analysis (if final URL returned HTML) ──
    if (redirectResult.html) {
      const pageAnalysis = analyzePageContent(redirectResult.html, redirectResult.finalUrl);

      if (pageAnalysis.hasCredentialHarvester) {
        addSignal(
          signals,
          "credential_harvester",
          30,
          "Page contains a form that submits credentials to a different domain",
        );
      }

      if (pageAnalysis.hasTitleMismatch) {
        addSignal(
          signals,
          "title_domain_mismatch",
          15,
          "Page title references a brand that doesn't match the hosting domain",
        );
      }

      if (pageAnalysis.hasHiddenElements) {
        addSignal(
          signals,
          "hidden_elements",
          10,
          "Page contains hidden forms or iframes (possible overlay attack)",
        );
      }

      if (pageAnalysis.hasUrgency) {
        if (riskyTlds.some((tld) => domain.endsWith(tld))) {
          addSignal(
            signals,
            "suspicious_tld_urgency",
            40,
            "Page uses urgency/pressure tactics while hosted on a high-risk TLD"
          );
        } else {
          addSignal(
            signals,
            "urgency_pressure",
            15,
            "Page content uses urgency/pressure tactics"
          );
        }
      }
    }
  } catch (error) {
    logger.warn(`Content analysis failed for ${url}: ${error.message}`);
  }

  return { score: scoreSignals(signals, 75), signals, expandedUrl };
};

// ════════════════════════════════════════════════════════════════════════
//  PUBLIC API: Orchestrators
// ════════════════════════════════════════════════════════════════════════

/**
 * Analyse a URL across all 4 detection layers.
 * @param {string} url - The URL to analyse
 * @returns {Promise<object>} Complete scan result with layered detection details
 */
const mergeEmbeddedUrlSignals = async (messageLayer, urls) => {
  const embeddedAnalyses = [];
  const layer2 = { score: 0, signals: [], threatIntel: null };
  const externalApiUsage = [];
  const rankedCandidates = [...new Set((urls || []).map(cleanUrl).filter(Boolean))]
    .map((embeddedUrl) => {
      const embeddedDomain = extractDomain(embeddedUrl);
      if (!embeddedDomain) return null;
      const urlRules = runUrlRules(embeddedUrl, embeddedDomain);
      const urlMl = runUrlMlScoring(embeddedUrl);
      return {
        embeddedUrl,
        embeddedDomain,
        urlRules,
        urlMl,
        localScore: Math.max(urlRules.score, urlMl.score),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.localScore - left.localScore);
  // Reputation is URL/path-specific, so distinct paths on the same host remain
  // eligible. Google lookups coalesce into batches of up to 50 destinations.
  // Extremely link-heavy input is explicitly sent to review rather than being
  // declared safe with incomplete reputation coverage.
  const selectedCandidates = rankedCandidates.slice(0, MAX_EMBEDDED_URL_CHECKS);
  if (rankedCandidates.length > MAX_EMBEDDED_URL_CHECKS) {
    addSignal(
      messageLayer.signals,
      "url_analysis_incomplete",
      31,
      `Message contains ${rankedCandidates.length} navigational URLs; reputation checks were limited to ${MAX_EMBEDDED_URL_CHECKS}`,
      { strength: "strong", category: "coverage", family: "coverage" },
    );
  }

  const embeddedResults = await Promise.all(
    selectedCandidates.map(async ({ embeddedUrl, embeddedDomain, urlRules, urlMl, localScore }) => {
      const blacklistResult = await runBlacklistChecks(embeddedUrl, embeddedDomain, {
        localScore,
      });

      const embeddedActiveLayers = blacklistResult.signals.length > 0
        ? ["rules", "blacklist", "ml"]
        : ["rules", "ml"];
      const embeddedScore = computeFinalScore(
        { rules: urlRules.score, blacklist: blacklistResult.score, ml: urlMl.score, content: 0 },
        LAYER_WEIGHTS,
        embeddedActiveLayers,
        blacklistResult.threatIntel,
      );

      return {
        embeddedUrl,
        embeddedDomain,
        urlRules,
        urlMl,
        blacklistResult,
        embeddedScore,
      };
    }),
  );

  for (const result of embeddedResults) {
    if (!result) continue;

    const { embeddedUrl, embeddedDomain, urlRules, urlMl, blacklistResult, embeddedScore } = result;

    urlRules.signals.filter((signal) => HIGH_VALUE_EMBEDDED_URL_SIGNALS.has(signal.name)).forEach((signal) => {
      addSignal(
        messageLayer.signals,
        `embedded_url_${signal.name}`,
        Math.ceil(signal.points * 0.8),
        `Embedded URL ${embeddedUrl}: ${signal.evidence}`,
        { strength: signal.strength, category: signal.category || "link" },
      );
    });

    if (blacklistResult.score > layer2.score) {
      layer2.score = blacklistResult.score;
      layer2.threatIntel = blacklistResult.threatIntel;
    }
    externalApiUsage.push(
      ...(blacklistResult.externalApiUsage || []).map((usage) => ({
        ...usage,
        url: embeddedUrl,
        domain: embeddedDomain,
      })),
    );
    blacklistResult.signals.forEach((signal) => {
      if (signal.name === "reputation_coverage_failed"
        && layer2.signals.some((existing) => existing.name === signal.name)) return;
      layer2.signals.push({
        ...signal,
        evidence: `Embedded URL ${embeddedUrl}: ${signal.evidence}`,
      });
    });

    embeddedAnalyses.push({
      url: embeddedUrl,
      domain: embeddedDomain,
      rules_score: urlRules.score,
      blacklist_score: blacklistResult.score,
      ml_score: urlMl.score,
      final_score: embeddedScore,
      classification: classify(embeddedScore),
    });
  }

  messageLayer.score = scoreSignals(messageLayer.signals, 180);
  return {
    layer2: { ...layer2, externalApiUsage },
    embeddedAnalyses,
    totalUrls: rankedCandidates.length,
    analyzedUrls: selectedCandidates.length,
  };
};

const analyzeUrl = async (url) => {
  const domain = extractDomain(url);

  // ── Run all layers (Layer 1 & 3 sync, Layer 2 & 4 async in parallel) ──
  const layer1 = runUrlRules(url, domain);
  const layer3 = runUrlMlScoring(url);
  const [layer2, layer4] = await Promise.all([
    runBlacklistChecks(url, domain, {
      localScore: Math.max(layer1.score, layer3.score),
    }),
    runContentAnalysis(url, domain),
  ]);

  // ── Compute weighted final score ──
  const layerScores = {
    rules: layer1.score,
    blacklist: layer2.score,
    ml: layer3.score,
    content: layer4.score,
  };

  const activeLayers = ["rules", "ml"];
  if (layer2.signals.length > 0) activeLayers.push("blacklist");
  if (layer4.signals.length > 0) activeLayers.push("content");

  const weightedRiskScore = computeFinalScore(layerScores, LAYER_WEIGHTS, activeLayers, layer2.threatIntel);
  const reputationCoverageFailed = layer2.signals.some(
    (signal) => signal.name === "reputation_coverage_failed",
  );
  const coverageAdjustedScore = reputationCoverageFailed
    ? Math.max(31, weightedRiskScore)
    : weightedRiskScore;
  const gatedVerdict = applyUrlEvidenceGates(
    coverageAdjustedScore,
    [...layer1.signals, ...layer2.signals, ...layer4.signals],
    layer2.threatIntel,
  );
  const riskScore = gatedVerdict.score;
  const effectiveWeights = getEffectiveWeights(LAYER_WEIGHTS, activeLayers);
  const classification = classify(riskScore);
  const allSignals = [
    ...layer1.signals,
    ...layer2.signals,
    ...layer4.signals,
  ];
  const userFeedback = buildUserFeedback({
    classification,
    riskScore,
    signals: allSignals,
    scanType: "url",
  });
  const scoring = buildScoringMetadata({
    layerScores,
    effectiveWeights,
    signals: allSignals,
    riskScore,
    classification,
    reason: gatedVerdict.reason === "weighted_average" && reputationCoverageFailed
      ? "reputation_coverage_review"
      : gatedVerdict.reason,
  });

  return {
    target: url,
    scan_type: "url",
    domain,
    risk_score: riskScore,
    classification,
    detection_details: {
      engine_version: ENGINE_VERSION,
      layers: {
        rules: { score: layer1.score, signals: layer1.signals },
        blacklist: { score: layer2.score, signals: layer2.signals },
        ml: { score: layer3.score, features: layer3.features },
        content: { score: layer4.score, signals: layer4.signals },
      },
      threat_intelligence: layer2.threatIntel,
      external_api_usage: layer2.externalApiUsage || [],
      user_feedback: userFeedback,
      scoring,
      expanded_url: layer4.expandedUrl,
      final_score: riskScore,
      layer_weights: effectiveWeights,
    },
    user_feedback: userFeedback,
  };
};

/**
 * Analyse an email or SMS message across Layers 1, 2, and 3.
 * Layer 4 (content analysis) does not apply to text messages.
 * @param {string} content - The message content
 * @param {string} scanType - "email" or "sms"
 * @returns {Promise<object>} Complete scan result with layered detection details
 */
const analyzeMessage = async (content, scanType = "email", options = {}) => {
  const { sender = null, trustedAuthentication = null } = options;
  const prepared = prepareMessageInput(content, scanType, { trustedAuthentication });
  const text = prepared.analysisText;

  // ── Layer 1: Rule-based checks ──
  const layer1 = runMessageRules(text, scanType, prepared);

  // ── Sender + reply behaviour (SMS or when sender is provided) ──
  let senderAnalysis = { score: 0, signals: [], senderType: "unknown" };
  let replyAnalysis = { score: 0, signals: [], supportsReply: false, explicitlyNoReply: false };

  if (scanType === "sms" || sender) {
    senderAnalysis = analyzeSender(sender, text);
    replyAnalysis = analyzeReplyBehaviour(text);
    layer1.signals.push(...senderAnalysis.signals, ...replyAnalysis.signals);
    layer1.score = scoreSignals(layer1.signals, 150);
  }

  // Analyze embedded URLs before combining message risk layers.
  const embeddedResult = await (prepared.urls.length > 0
    ? mergeEmbeddedUrlSignals(layer1, prepared.urls)
    : Promise.resolve(null));

  // ── Layer 2: Process embedded URLs ──
  const layer2 = { score: 0, signals: [], threatIntel: null };
  let embeddedUrlAnalyses = [];
  if (embeddedResult) {
    layer2.score = embeddedResult.layer2.score;
    layer2.signals = embeddedResult.layer2.signals;
    layer2.threatIntel = embeddedResult.layer2.threatIntel;
    layer2.externalApiUsage = embeddedResult.layer2.externalApiUsage || [];
    embeddedUrlAnalyses = embeddedResult.embeddedAnalyses;
  }

  // ── Layer 3: ML scoring ──
  const layer3 = runMessageMlScoring(prepared.modelText);
  const messageSignals = [...layer1.signals, ...layer2.signals, ...layer3.signals];
  const evidenceSummary = summarizeEvidence(messageSignals);

  // ── Compute weighted score with rules escalation and blacklist-neutral redistribution ──
  const { score: riskScore, reason: scoringReason, effectiveWeights } = computeMessageScore(
    layer1.score,
    layer2.score,
    layer3.score,
    layer2.threatIntel,
    evidenceSummary,
  );

  const userGuide = generateUserGuide(
    classify(riskScore),
    messageSignals,
    senderAnalysis,
    replyAnalysis,
    scanType,
  );
  const classification = classify(riskScore);
  const userFeedback = buildUserFeedback({
    classification,
    riskScore,
    signals: messageSignals,
    scanType,
  });
  const scoring = buildScoringMetadata({
    layerScores: {
      rules: layer1.score,
      blacklist: layer2.score,
      ml: layer3.score,
      content: 0,
    },
    effectiveWeights,
    signals: messageSignals,
    riskScore,
    classification,
    reason: scoringReason,
  });

  // ── Summary message ──
  let summary;
  if (riskScore >= 61) {
    summary = "High-risk phishing indicators were detected.";
  } else if (riskScore >= 31) {
    summary = "Some suspicious indicators were detected.";
  } else {
    summary = "No strong phishing indicators were detected.";
  }

  return {
    target: text.slice(0, 500),
    scan_type: scanType,
    risk_score: riskScore,
    classification,
    detection_details: {
      engine_version: ENGINE_VERSION,
      layers: {
        rules: { score: layer1.score, signals: layer1.signals },
        blacklist: { score: layer2.score, signals: layer2.signals },
        ml: {
          score: layer3.score,
          model_type: "deterministic_contextual_features",
          features: layer3.features,
          signals: layer3.signals,
        },
      },
      message_analysis: {
        input_mode: prepared.inputMode,
        authentication: prepared.authentication,
        authentication_note: prepared.authentication.trusted
          ? "Authentication failures came from server-controlled ingress; passes still do not prove that content is safe."
          : "Authentication-Results in uploaded content are caller-controlled and are shown for context only, not scored.",
        url_count: prepared.urls.length,
        analyzed_url_count: embeddedResult?.analyzedUrls || 0,
        attachment_count: prepared.attachments.length,
        attachments: prepared.attachments.map((attachment) => ({
          filename: attachment.filename || null,
          content_type: attachment.contentType || null,
          size: attachment.size || 0,
          inline: Boolean(attachment.inline),
        })),
      },
      threat_intelligence: layer2.threatIntel,
      external_api_usage: layer2.externalApiUsage || [],
      user_feedback: userFeedback,
      scoring,
      embedded_urls: embeddedUrlAnalyses,
      summary,
      final_score: riskScore,
      scoring_reason: scoringReason,
      layer_weights: effectiveWeights,
      user_guide: userGuide,
    },
    user_guide: userGuide,
    user_feedback: userFeedback,
  };
};

module.exports = {
  analyzeUrl,
  analyzeMessage,
  computeFinalScore,
  computeMessageScore,
  applyUrlEvidenceGates,
  ENGINE_VERSION,
};

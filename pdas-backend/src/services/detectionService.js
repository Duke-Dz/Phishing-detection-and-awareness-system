/**
 * @module detectionService
 * @description Core phishing detection engine — 4-layer defence-in-depth architecture.
 *
 * Layer 1: Rule-based signal checks (fast, runs first)
 * Layer 2: External threat intelligence / blacklist lookups
 * Layer 3: Feature-based scoring
 * Layer 4: Heuristic content analysis (page-level, for URLs)
 *
 * All layers feed into a weighted scoring formula:
 *   finalScore = (rules × 0.35) + (blacklist × 0.30) + (ml × 0.25) + (content × 0.10)
 */

const { extractDomain, lookupDomain } = require("./threatIntelService");
const { checkExternalSources } = require("./externalThreatService");
const { checkTyposquatting } = require("./typosquattingService");
const { checkAtTrick, checkSubdomainImpersonation, checkExcessiveSubdomains } = require("./urlTricksService");
const { parseAuthenticationResults, checkDisplayNameSpoofing, checkEmbeddedLinkMismatch } = require("./emailAuthService");
const { checkKenyanImpersonation, checkKenyanPhishingPhrases } = require("../data/kenyanPatterns");
const { extractUrlFeatures, extractMessageFeatures, scoreUrlFeatures, scoreMessageFeatures } = require("./mlScorerService");
const { expandShortUrl, followRedirects, analyzePageContent } = require("./contentAnalysisService");
const { analyzeSender, analyzeReplyBehaviour } = require("../utils/senderAnalyzer");
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

const suspiciousKeywords = [
  "verify", "urgent", "password", "suspended", "limited",
  "login", "wallet", "bank", "confirm", "reward", "prize", "otp",
  "expire", "compromise", "unauthorised", "unauthorized",
  "click here", "free", "winner", "selected", "claim",
  "gift", "transfer", "update", "secure",
];

const financialDomainKeywords = [
  "bank", "secure", "login", "verify", "account", "wallet",
  "payment", "mpesa", "m-pesa", "paypal", "update", "confirm",
];

const urgencyPhrases = [
  "act now", "immediately", "within 24 hours", "final warning",
  "your account will be", "verify immediately", "unusual activity",
  "has been compromised", "avoid charges", "expires today",
  "last chance", "failure to act",
];

const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "rb.gy", "shorturl.at", "cutt.ly", "tiny.cc"];
const riskyTlds = [".zip", ".mov", ".xyz", ".top", ".click", ".loan", ".work", ".tk", ".ml", ".ga", ".cf"];

// ── Helpers ────────────────────────────────────────────────────────────

const classify = (score) => {
  if (score >= 61) return "phishing";
  if (score >= 31) return "suspicious";
  return "safe";
};

const addSignal = (signals, name, points, evidence) => {
  signals.push({ name, points, evidence });
};

const scoreSignals = (signals, maxExpected) => {
  const rawPoints = signals.reduce((total, s) => total + s.points, 0);
  // Accumulate risk directly rather than treating it as a percentage of a theoretical maximum
  return Math.min(100, Math.round(rawPoints));
};

/**
 * Compute weighted final score from individual layer scores.
 * @param {{ rules: number, blacklist: number, ml: number, content: number }} layerScores
 * @returns {number} 0-100 weighted score
 */
const hasConfirmedThreatIntel = (threatIntel) => {
  if (!threatIntel?.is_blacklisted) return false;
  return ["phishing", "malware", "credential_theft"].includes(
    String(threatIntel.threat_type || "").toLowerCase(),
  );
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
  rules_escalation: { rules: 0.55, ml: 0.45 },
  blacklist_confirmed: { rules: 0.50, blacklist: 0.35, ml: 0.15 },
  blacklist_neutral: { rules: 0.60, ml: 0.40 },
  weighted_average: MESSAGE_LAYER_WEIGHTS,
};

/**
 * Compute final SMS/email score with rules escalation and blacklist-neutral redistribution.
 * @returns {{ score: number, reason: string, effectiveWeights: object }}
 */
const computeMessageScore = (rulesScore, blacklistScore, mlScore, threatIntel = null) => {
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

  if (rulesScore >= 75) {
    const weights = SCORING_WEIGHTS.rules_escalation;
    const score = Math.round((rulesScore * weights.rules) + (mlScore * weights.ml));
    return {
      score: Math.max(70, Math.min(100, score)),
      reason: "rules_escalation",
      effectiveWeights: { ...weights, blacklist: 0, content: 0 },
    };
  }

  if (blacklistScore === 0) {
    const weights = SCORING_WEIGHTS.blacklist_neutral;
    const score = Math.round((rulesScore * weights.rules) + (mlScore * weights.ml));
    return {
      score: Math.min(100, score),
      reason: "blacklist_neutral",
      effectiveWeights: { ...weights, blacklist: 0, content: 0 },
    };
  }

  const weights = SCORING_WEIGHTS.weighted_average;
  const score = Math.round(
    (rulesScore * weights.rules) + (blacklistScore * weights.blacklist) + (mlScore * weights.ml),
  );
  return {
    score: Math.min(100, score),
    reason: "weighted_average",
    effectiveWeights: { ...weights, content: 0 },
  };
};

/**
 * Normalise a layer's raw signal points into a 0-100 scale.
 * @param {number} rawPoints - Sum of signal points for this layer
 * @param {number} maxExpected - Expected maximum for this layer
 * @returns {number} 0-100 normalised score
 */
const normaliseLayerScore = (rawPoints, maxExpected) => {
  return Math.min(100, Math.round((rawPoints / maxExpected) * 100));
};

const topSignalReasons = (signals, limit = 5) =>
  signals
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
        "Avoid entering passwords, OTPs, card details, or M-PESA PINs from this content.",
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
    addSignal(signals, "missing_https", 15, "URL does not use HTTPS");
  }

  if (shorteners.includes(domain)) {
    addSignal(signals, "url_shortener", 20, "URL uses a known shortening service");
  }

  if (riskyTlds.some((tld) => domain.endsWith(tld))) {
    addSignal(signals, "risky_tld", 15, "Domain uses a high-risk top-level domain");
  }

  if (/\d+\.\d+\.\d+\.\d+/.test(domain)) {
    addSignal(signals, "ip_address_domain", 25, "URL uses an IP address instead of a domain");
  }

  if (domain.includes("xn--") || domain.replace(/-/g, "").length < domain.length - 2) {
    addSignal(signals, "suspicious_domain_shape", 10, "Domain contains unusual characters");
  }

  // ── Keyword scanning ──
  const lowerUrl = url.toLowerCase();
  suspiciousKeywords
    .filter((keyword) => lowerUrl.includes(keyword))
    .slice(0, 5)
    .forEach((keyword) =>
      addSignal(signals, "suspicious_keyword", 6, `Contains keyword: ${keyword}`),
    );

  const financialMatches = financialDomainKeywords.filter((keyword) => domain.includes(keyword));
  if (financialMatches.length >= 2) {
    addSignal(
      signals,
      "financial_keyword_domain",
      25,
      `Domain contains multiple financial/security terms: ${financialMatches.slice(0, 4).join(", ")}`,
    );
  }

  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount >= 2 && financialMatches.length > 0) {
    addSignal(
      signals,
      "hyphenated_security_domain",
      10,
      `Domain contains ${hyphenCount} hyphens with security-style wording`,
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
      30,
      `${attackLabel}: domain "${domain}" impersonates "${typosquat.matchedBrand}"${distanceText}`,
    );
  }

  // Userinfo abuse detection
  const atTrick = checkAtTrick(url);
  if (atTrick.detected) {
    addSignal(
      signals,
      "at_trick",
      25,
      `URL uses @ trick: appears as "${atTrick.fakeDomain}" but navigates to "${atTrick.realDomain}"`,
    );
  }

  // Subdomain impersonation
  const subImpersonation = checkSubdomainImpersonation(url);
  if (subImpersonation.detected) {
    addSignal(
      signals,
      "subdomain_impersonation",
      20,
      `Brand "${subImpersonation.impersonatedBrand}" used as subdomain of "${subImpersonation.actualDomain}"`,
    );
  }

  // Excessive subdomains
  const excessiveSubs = checkExcessiveSubdomains(url);
  if (excessiveSubs.detected) {
    addSignal(
      signals,
      "excessive_subdomains",
      10,
      `Domain has ${excessiveSubs.subdomainCount} subdomain levels (suspicious nesting)`,
    );
  }

  return { score: scoreSignals(signals, 150), signals };
};

/**
 * Run all Layer 1 rule-based checks for an email/SMS message.
 * @param {string} text - The message content
 * @param {string} scanType - "email" or "sms"
 * @returns {{ score: number, signals: object[] }}
 */
const runMessageRules = (text, scanType) => {
  const lowerText = text.toLowerCase();
  const signals = [];

  // ── Phishing language keywords ──
  suspiciousKeywords
    .filter((keyword) => lowerText.includes(keyword))
    .slice(0, 8)
    .forEach((keyword) =>
      addSignal(signals, "phishing_language", 7, `Contains keyword: ${keyword}`),
    );

  // ── Contains links ──
  if (/https?:\/\/[^\s]+/i.test(text)) {
    addSignal(signals, "contains_link", 12, "Message contains at least one URL");
  }

  // ── Sensitive data requests ──
  if (/password|pin|otp|card number|mpesa|m-pesa|credit card|cvv|bank account/i.test(text)) {
    addSignal(signals, "asks_for_sensitive_data", 25, "Message asks for sensitive information");
  }

  // ── Urgency/fear tactics ──
  const matchedUrgency = urgencyPhrases.filter((phrase) => lowerText.includes(phrase));
  if (matchedUrgency.length > 0) {
    addSignal(
      signals,
      "urgency_pressure",
      18,
      `Message uses urgency tactics: ${matchedUrgency.slice(0, 3).join(", ")}`,
    );
  }

  // ── Email-specific checks ──
  if (scanType === "email") {
    // Missing headers
    if (!/from:/i.test(text)) {
      addSignal(signals, "missing_email_headers", 8, "Email text has no visible From header");
    }

    // SPF/DKIM/DMARC
    const authResults = parseAuthenticationResults(text);
    if (authResults.spf === "fail" || authResults.spf === "softfail") {
      addSignal(signals, "spf_fail", 15, `SPF check: ${authResults.spf}`);
    }
    if (authResults.dkim === "fail") {
      addSignal(signals, "dkim_fail", 15, "DKIM check: fail");
    }
    if (authResults.dmarc === "fail") {
      addSignal(signals, "dmarc_fail", 15, "DMARC check: fail");
    }

    // Display name spoofing
    const fromMatch = text.match(/from:\s*(.+)/i);
    if (fromMatch) {
      const spoofResult = checkDisplayNameSpoofing(fromMatch[1].trim());
      if (spoofResult.isSpoofed) {
        addSignal(
          signals,
          "display_name_spoof",
          20,
          `Display name claims "${spoofResult.claimedBrand}" but sent from "${spoofResult.actualDomain}"`,
        );
      }
    }

    // Embedded link mismatch
    const linkMismatch = checkEmbeddedLinkMismatch(text);
    if (linkMismatch.hasMismatch) {
      addSignal(
        signals,
        "link_text_mismatch",
        20,
        `Link text shows different domain than actual URL (${linkMismatch.mismatches.length} mismatch${linkMismatch.mismatches.length > 1 ? "es" : ""})`,
      );
    }
  }

  // Kenya-specific checks
  const kenyanImpersonation = checkKenyanImpersonation(text);
  if (kenyanImpersonation.detected) {
    addSignal(
      signals,
      "kenyan_impersonation",
      18,
      `Mentions Kenyan brand(s): ${kenyanImpersonation.brands.join(", ")}`,
    );
  }

  const kenyanPhrases = checkKenyanPhishingPhrases(text);
  if (kenyanPhrases.detected) {
    kenyanPhrases.phrases.slice(0, 3).forEach((phrase) =>
      addSignal(signals, "kenyan_phishing_phrase", 10, `Contains Kenyan phishing phrase: "${phrase}"`),
    );
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
//  LAYER 3: ML-Style Feature-Based Classification
// ════════════════════════════════════════════════════════════════════════

/**
 * Run Layer 3 ML feature extraction and scoring for a URL.
 * @param {string} url - The URL to analyse
 * @returns {{ score: number, features: object }}
 */
const runUrlMlScoring = (url) => {
  try {
    const features = extractUrlFeatures(url);
    const score = scoreUrlFeatures(features);
    return { score, features };
  } catch (error) {
    logger.warn(`ML URL scoring failed: ${error.message}`);
    return { score: 0, features: {} };
  }
};

/**
 * Run Layer 3 ML feature extraction and scoring for a message.
 * @param {string} text - The message content
 * @returns {{ score: number, features: object }}
 */
const runMessageMlScoring = (text) => {
  try {
    const features = extractMessageFeatures(text);
    const score = scoreMessageFeatures(features);
    return { score, features };
  } catch (error) {
    logger.warn(`ML message scoring failed: ${error.message}`);
    return { score: 0, features: {} };
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

  const embeddedResults = await Promise.all(
    urls.slice(0, 3).map(async (embeddedUrl) => {
      const embeddedDomain = extractDomain(embeddedUrl);
      if (!embeddedDomain) return null;

      const urlRules = runUrlRules(embeddedUrl, embeddedDomain);
      const urlMl = runUrlMlScoring(embeddedUrl);
      const blacklistResult = await runBlacklistChecks(embeddedUrl, embeddedDomain, {
        localScore: Math.max(urlRules.score, urlMl.score),
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

    urlRules.signals.forEach((signal) => {
      addSignal(
        messageLayer.signals,
        `embedded_url_${signal.name}`,
        Math.ceil(signal.points * 0.8),
        `Embedded URL ${embeddedUrl}: ${signal.evidence}`,
      );
    });

    if (urlMl.score >= 60) {
      addSignal(
        messageLayer.signals,
        "embedded_url_ml_high_risk",
        20,
        `Embedded URL ${embeddedUrl}: URL feature model scored ${urlMl.score}/100`,
      );
    }

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
  return { layer2: { ...layer2, externalApiUsage }, embeddedAnalyses };
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

  const riskScore = computeFinalScore(layerScores, LAYER_WEIGHTS, activeLayers, layer2.threatIntel);
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
    reason: hasConfirmedThreatIntel(layer2.threatIntel) || layer2.score >= 80
      ? "blacklist_confirmed"
      : "weighted_average",
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
  const { sender = null } = options;
  const text = String(content || "");

  // ── Layer 1: Rule-based checks ──
  const layer1 = runMessageRules(text, scanType);

  // ── Sender + reply behaviour (SMS or when sender is provided) ──
  let senderAnalysis = { score: 0, signals: [], senderType: "unknown" };
  let replyAnalysis = { score: 0, signals: [], supportsReply: false, explicitlyNoReply: false };

  if (scanType === "sms" || sender) {
    senderAnalysis = analyzeSender(sender, text);
    replyAnalysis = analyzeReplyBehaviour(text);
    layer1.signals.push(...senderAnalysis.signals, ...replyAnalysis.signals);
    const senderRawPoints = senderAnalysis.score + replyAnalysis.score;
    layer1.score = Math.min(100, layer1.score + Math.round(senderRawPoints * 0.3));
  }

  // Analyze embedded URLs before combining message risk layers.
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi);
  const embeddedResult = await ((urlMatches && urlMatches.length > 0)
    ? mergeEmbeddedUrlSignals(layer1, urlMatches)
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
  const layer3 = runMessageMlScoring(text);

  // ── Compute weighted score with rules escalation and blacklist-neutral redistribution ──
  const { score: riskScore, reason: scoringReason, effectiveWeights } = computeMessageScore(
    layer1.score,
    layer2.score,
    layer3.score,
    layer2.threatIntel
  );

  const userGuide = generateUserGuide(
    classify(riskScore),
    [...layer1.signals, ...layer2.signals],
    senderAnalysis,
    replyAnalysis,
  );
  const classification = classify(riskScore);
  const userFeedback = buildUserFeedback({
    classification,
    riskScore,
    signals: [...layer1.signals, ...layer2.signals],
    scanType,
  });
  const messageSignals = [...layer1.signals, ...layer2.signals];
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
        ml: { score: layer3.score, features: layer3.features },
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
  ENGINE_VERSION,
};

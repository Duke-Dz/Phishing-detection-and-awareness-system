/**
 * @module detectionService
 * @description Core phishing detection engine — 4-layer defence-in-depth architecture.
 *
 * Layer 1: Rule-based signal checks (fast, runs first)
 * Layer 2: External threat intelligence / blacklist lookups
 * Layer 3: ML-style feature-based classification (pure JavaScript)
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
const logger = require("../utils/logger");

// ── Constants ──────────────────────────────────────────────────────────

const ENGINE_VERSION = "2.0.0";

const LAYER_WEIGHTS = {
  rules: 0.35,
  blacklist: 0.30,
  ml: 0.25,
  content: 0.10,
};

const suspiciousKeywords = [
  "verify", "urgent", "password", "suspended", "limited",
  "login", "wallet", "bank", "confirm", "reward", "prize", "otp",
  "expire", "compromise", "unauthorised", "unauthorized",
  "click here", "free", "winner", "selected", "claim",
  "gift", "transfer", "update", "secure",
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

/**
 * Compute weighted final score from individual layer scores.
 * @param {{ rules: number, blacklist: number, ml: number, content: number }} layerScores
 * @returns {number} 0-100 weighted score
 */
const computeFinalScore = (layerScores) => {
  const weighted = Object.entries(LAYER_WEIGHTS).reduce((sum, [layer, weight]) => {
    return sum + (layerScores[layer] || 0) * weight;
  }, 0);
  return Math.min(100, Math.round(weighted));
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

  // ── Original checks ──
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

  // ── NEW: Typosquatting detection ──
  const typosquat = checkTyposquatting(domain);
  if (typosquat.isTyposquat) {
    const attackLabel = typosquat.attackType === "character_substitution"
      ? "Character substitution"
      : "Typosquatting";
    addSignal(
      signals,
      "typosquatting",
      30,
      `${attackLabel}: domain "${domain}" impersonates "${typosquat.matchedBrand}" (edit distance: ${typosquat.editDistance})`,
    );
  }

  // ── NEW: @ trick detection ──
  const atTrick = checkAtTrick(url);
  if (atTrick.detected) {
    addSignal(
      signals,
      "at_trick",
      25,
      `URL uses @ trick: appears as "${atTrick.fakeDomain}" but navigates to "${atTrick.realDomain}"`,
    );
  }

  // ── NEW: Subdomain impersonation ──
  const subImpersonation = checkSubdomainImpersonation(url);
  if (subImpersonation.detected) {
    addSignal(
      signals,
      "subdomain_impersonation",
      20,
      `Brand "${subImpersonation.impersonatedBrand}" used as subdomain of "${subImpersonation.actualDomain}"`,
    );
  }

  // ── NEW: Excessive subdomains ──
  const excessiveSubs = checkExcessiveSubdomains(url);
  if (excessiveSubs.detected) {
    addSignal(
      signals,
      "excessive_subdomains",
      10,
      `Domain has ${excessiveSubs.subdomainCount} subdomain levels (suspicious nesting)`,
    );
  }

  const rawPoints = signals.reduce((total, s) => total + s.points, 0);
  return { score: normaliseLayerScore(rawPoints, 150), signals };
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

    // ── NEW: SPF/DKIM/DMARC ──
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

    // ── NEW: Display name spoofing ──
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

    // ── NEW: Embedded link mismatch ──
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

  // ── NEW: Kenya-specific checks (applies to both email and SMS) ──
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

  const rawPoints = signals.reduce((total, s) => total + s.points, 0);
  return { score: normaliseLayerScore(rawPoints, 150), signals };
};

// ════════════════════════════════════════════════════════════════════════
//  LAYER 2: Blacklist / Threat Intelligence
// ════════════════════════════════════════════════════════════════════════

/**
 * Run Layer 2 blacklist and external threat intelligence checks.
 * @param {string} url - The full URL
 * @param {string} domain - Extracted domain
 * @returns {Promise<{ score: number, signals: object[], threatIntel: object|null }>}
 */
const runBlacklistChecks = async (url, domain) => {
  const signals = [];
  let threatIntel = null;

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
    const externalResult = await checkExternalSources(url, domain);
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
          threat_type: externalResult.sources[0]?.threatType || "unknown",
        };
      }
    }
  } catch (error) {
    logger.warn(`External threat check failed for ${domain}: ${error.message}`);
  }

  const rawPoints = signals.reduce((total, s) => total + s.points, 0);
  return { score: normaliseLayerScore(rawPoints, 90), signals, threatIntel };
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
      addSignal(
        signals,
        "shortened_url_expanded",
        5,
        `Shortened URL expands to: ${shortResult.expandedUrl}`,
      );
    }

    // ── Follow redirect chain ──
    const targetUrl = expandedUrl || url;
    const redirectResult = await followRedirects(targetUrl);

    if (redirectResult.hopCount >= 3) {
      addSignal(
        signals,
        "excessive_redirects",
        15,
        `URL redirects ${redirectResult.hopCount} times before reaching final destination`,
      );
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
    }
  } catch (error) {
    logger.warn(`Content analysis failed for ${url}: ${error.message}`);
  }

  const rawPoints = signals.reduce((total, s) => total + s.points, 0);
  return { score: normaliseLayerScore(rawPoints, 75), signals, expandedUrl };
};

// ════════════════════════════════════════════════════════════════════════
//  PUBLIC API: Orchestrators
// ════════════════════════════════════════════════════════════════════════

/**
 * Analyse a URL across all 4 detection layers.
 * @param {string} url - The URL to analyse
 * @returns {Promise<object>} Complete scan result with layered detection details
 */
const analyzeUrl = async (url) => {
  const domain = extractDomain(url);

  // ── Run all layers (Layer 1 & 3 sync, Layer 2 & 4 async in parallel) ──
  const layer1 = runUrlRules(url, domain);
  const layer3 = runUrlMlScoring(url);
  const [layer2, layer4] = await Promise.all([
    runBlacklistChecks(url, domain),
    runContentAnalysis(url, domain),
  ]);

  // ── Compute weighted final score ──
  const layerScores = {
    rules: layer1.score,
    blacklist: layer2.score,
    ml: layer3.score,
    content: layer4.score,
  };

  const riskScore = computeFinalScore(layerScores);

  return {
    target: url,
    scan_type: "url",
    domain,
    risk_score: riskScore,
    classification: classify(riskScore),
    detection_details: {
      engine_version: ENGINE_VERSION,
      layers: {
        rules: { score: layer1.score, signals: layer1.signals },
        blacklist: { score: layer2.score, signals: layer2.signals },
        ml: { score: layer3.score, features: layer3.features },
        content: { score: layer4.score, signals: layer4.signals },
      },
      threat_intelligence: layer2.threatIntel,
      expanded_url: layer4.expandedUrl,
      final_score: riskScore,
      layer_weights: LAYER_WEIGHTS,
    },
  };
};

/**
 * Analyse an email or SMS message across Layers 1, 2, and 3.
 * Layer 4 (content analysis) does not apply to text messages.
 * @param {string} content - The message content
 * @param {string} scanType - "email" or "sms"
 * @returns {Promise<object>} Complete scan result with layered detection details
 */
const analyzeMessage = async (content, scanType = "email") => {
  const text = String(content || "");
  const lowerText = text.toLowerCase();

  // ── Layer 1: Rule-based checks ──
  const layer1 = runMessageRules(text, scanType);

  // ── Layer 2: Check any URLs found in the message ──
  const layer2 = { score: 0, signals: [], threatIntel: null };
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi);
  if (urlMatches && urlMatches.length > 0) {
    // Check the first URL found against threat intelligence
    const firstUrl = urlMatches[0];
    const urlDomain = extractDomain(firstUrl);
    if (urlDomain) {
      const blacklistResult = await runBlacklistChecks(firstUrl, urlDomain);
      layer2.score = blacklistResult.score;
      layer2.signals = blacklistResult.signals;
      layer2.threatIntel = blacklistResult.threatIntel;
    }
  }

  // ── Layer 3: ML scoring ──
  const layer3 = runMessageMlScoring(text);

  // ── Compute weighted score (Layer 4 weight redistributed) ──
  // For messages, Layer 4 doesn't apply, so redistribute its weight:
  // rules=0.40, blacklist=0.33, ml=0.27
  const messageWeights = { rules: 0.40, blacklist: 0.33, ml: 0.27 };
  const weightedScore =
    (layer1.score * messageWeights.rules) +
    (layer2.score * messageWeights.blacklist) +
    (layer3.score * messageWeights.ml);
  const riskScore = Math.min(100, Math.round(weightedScore));

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
    classification: classify(riskScore),
    detection_details: {
      engine_version: ENGINE_VERSION,
      layers: {
        rules: { score: layer1.score, signals: layer1.signals },
        blacklist: { score: layer2.score, signals: layer2.signals },
        ml: { score: layer3.score, features: layer3.features },
      },
      threat_intelligence: layer2.threatIntel,
      summary,
      final_score: riskScore,
      layer_weights: messageWeights,
    },
  };
};

module.exports = { analyzeUrl, analyzeMessage };

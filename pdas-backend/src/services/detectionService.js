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
<<<<<<< HEAD
const { analyzeSender, analyzeReplyBehaviour } = require("../utils/senderAnalyzer");
const { generateUserGuide } = require("../utils/userGuideGenerator");
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
  return normaliseLayerScore(rawPoints, maxExpected);
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

<<<<<<< HEAD
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

=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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

  // ── NEW: Typosquatting detection ──
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

  return { score: scoreSignals(signals, 150), signals };
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

  const signalScore = scoreSignals(signals, 90);
  const reputationScore = threatIntel?.is_blacklisted
    ? Number(threatIntel.reputation_score || 0)
    : 0;

  return { score: Math.max(signalScore, reputationScore), signals, threatIntel };
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

<<<<<<< HEAD
  const embeddedResults = await Promise.all(
    urls.slice(0, 3).map(async (embeddedUrl) => {
      const embeddedDomain = extractDomain(embeddedUrl);
      if (!embeddedDomain) return null;

      const urlRules = runUrlRules(embeddedUrl, embeddedDomain);
      const urlMl = runUrlMlScoring(embeddedUrl);
      const blacklistResult = await runBlacklistChecks(embeddedUrl, embeddedDomain);

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

=======
  for (const embeddedUrl of urls.slice(0, 3)) {
    const embeddedDomain = extractDomain(embeddedUrl);
    if (!embeddedDomain) continue;

    const urlRules = runUrlRules(embeddedUrl, embeddedDomain);
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
    urlRules.signals.forEach((signal) => {
      addSignal(
        messageLayer.signals,
        `embedded_url_${signal.name}`,
        Math.ceil(signal.points * 0.8),
        `Embedded URL ${embeddedUrl}: ${signal.evidence}`,
      );
    });

<<<<<<< HEAD
=======
    const urlMl = runUrlMlScoring(embeddedUrl);
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
    if (urlMl.score >= 60) {
      addSignal(
        messageLayer.signals,
        "embedded_url_ml_high_risk",
        20,
        `Embedded URL ${embeddedUrl}: URL feature model scored ${urlMl.score}/100`,
      );
    }

<<<<<<< HEAD
=======
    const blacklistResult = await runBlacklistChecks(embeddedUrl, embeddedDomain);
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
    if (blacklistResult.score > layer2.score) {
      layer2.score = blacklistResult.score;
      layer2.threatIntel = blacklistResult.threatIntel;
    }
    blacklistResult.signals.forEach((signal) => {
      layer2.signals.push({
        ...signal,
        evidence: `Embedded URL ${embeddedUrl}: ${signal.evidence}`,
      });
    });

<<<<<<< HEAD
=======
    const embeddedActiveLayers = blacklistResult.signals.length > 0
      ? ["rules", "blacklist", "ml"]
      : ["rules", "ml"];
    const embeddedScore = computeFinalScore(
      { rules: urlRules.score, blacklist: blacklistResult.score, ml: urlMl.score, content: 0 },
      LAYER_WEIGHTS,
      embeddedActiveLayers,
      blacklistResult.threatIntel,
    );

>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
  return { layer2, embeddedAnalyses };
};

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

  const activeLayers = ["rules", "ml"];
  if (layer2.signals.length > 0) activeLayers.push("blacklist");
  if (layer4.signals.length > 0) activeLayers.push("content");

  const riskScore = computeFinalScore(layerScores, LAYER_WEIGHTS, activeLayers, layer2.threatIntel);
  const effectiveWeights = getEffectiveWeights(LAYER_WEIGHTS, activeLayers);

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
      layer_weights: effectiveWeights,
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
<<<<<<< HEAD
const analyzeMessage = async (content, scanType = "email", options = {}) => {
  const { sender = null } = options;
  const text = String(content || "");
=======
const analyzeMessage = async (content, scanType = "email") => {
  const text = String(content || "");
  const lowerText = text.toLowerCase();
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

  // ── Layer 1: Rule-based checks ──
  const layer1 = runMessageRules(text, scanType);

<<<<<<< HEAD
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

=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
  // ── Layer 2: Check any URLs found in the message ──
  const layer2 = { score: 0, signals: [], threatIntel: null };
  let embeddedUrlAnalyses = [];
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi);
  if (urlMatches && urlMatches.length > 0) {
    const embeddedResult = await mergeEmbeddedUrlSignals(layer1, urlMatches);
    layer2.score = embeddedResult.layer2.score;
    layer2.signals = embeddedResult.layer2.signals;
    layer2.threatIntel = embeddedResult.layer2.threatIntel;
    embeddedUrlAnalyses = embeddedResult.embeddedAnalyses;
  }

  // ── Layer 3: ML scoring ──
  const layer3 = runMessageMlScoring(text);

<<<<<<< HEAD
  // ── Compute weighted score with rules escalation and blacklist-neutral redistribution ──
  const { score: riskScore, reason: scoringReason, effectiveWeights } = computeMessageScore(
    layer1.score,
    layer2.score,
    layer3.score,
    layer2.threatIntel,
  );

  const userGuide = generateUserGuide(
    classify(riskScore),
    [...layer1.signals, ...layer2.signals],
    senderAnalysis,
    replyAnalysis,
  );

=======
  // ── Compute weighted score (Layer 4 weight redistributed) ──
  // For messages, Layer 4 doesn't apply, so redistribute its weight:
  // rules=0.40, blacklist=0.33, ml=0.27
  const messageWeights = MESSAGE_LAYER_WEIGHTS;
  const riskScore = computeFinalScore(
    { rules: layer1.score, blacklist: layer2.score, ml: layer3.score },
    messageWeights,
    ["rules", "blacklist", "ml"],
    layer2.threatIntel,
  );

>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
      embedded_urls: embeddedUrlAnalyses,
      summary,
      final_score: riskScore,
<<<<<<< HEAD
      scoring_reason: scoringReason,
      layer_weights: effectiveWeights,
      user_guide: userGuide,
    },
    user_guide: userGuide,
  };
};

module.exports = {
  analyzeUrl,
  analyzeMessage,
  computeFinalScore,
  computeMessageScore,
  ENGINE_VERSION,
};
=======
      layer_weights: messageWeights,
    },
  };
};

module.exports = { analyzeUrl, analyzeMessage, computeFinalScore, ENGINE_VERSION };
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

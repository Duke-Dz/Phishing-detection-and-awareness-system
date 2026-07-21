const http = require("http");
const https = require("https");
const { URL } = require("url");
const dns = require("dns");
const net = require("net");
const { promisify } = require("util");

const dnsLookup = promisify(dns.lookup);

const REQUEST_TIMEOUT_MS = 1500;
const MAX_HTML_BYTES = 512 * 1024;

const SHORTENER_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
  "is.gd", "rb.gy", "shorturl.at", "cutt.ly", "tiny.cc",
]);

const KNOWN_BRANDS = [
  "paypal", "apple", "google", "microsoft", "amazon",
  "netflix", "facebook", "instagram", "twitter", "whatsapp",
  "chase", "wellsfargo", "citi", "bankofamerica", "hsbc",
  "dropbox", "linkedin", "yahoo", "outlook", "icloud",
];

const PRIVATE_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

const parseIpv6Words = (address) => {
  let input = String(address || "").toLowerCase().split("%", 1)[0];
  if (input.includes(".")) {
    const separator = input.lastIndexOf(":");
    const ipv4 = input.slice(separator + 1);
    if (net.isIP(ipv4) !== 4) return null;
    const bytes = ipv4.split(".").map(Number);
    input = `${input.slice(0, separator)}:${((bytes[0] << 8) | bytes[1]).toString(16)}:${((bytes[2] << 8) | bytes[3]).toString(16)}`;
  }

  const halves = input.split("::");
  if (halves.length > 2) return null;
  const readHalf = (part) => (part ? part.split(":") : []).map((word) => {
    if (!/^[0-9a-f]{1,4}$/.test(word)) return NaN;
    return Number.parseInt(word, 16);
  });
  const left = readHalf(halves[0]);
  const right = readHalf(halves[1] || "");
  if ([...left, ...right].some(Number.isNaN)) return null;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  return [...left, ...Array(Math.max(0, missing)).fill(0), ...right];
};

const ipv4FromIpv6Tail = (words) => {
  if (!Array.isArray(words) || words.length !== 8) return null;
  return [
    words[6] >> 8,
    words[6] & 0xff,
    words[7] >> 8,
    words[7] & 0xff,
  ].join(".");
};

const URGENCY_PHRASES = [
  "act now", "immediately", "within 24 hours", "final warning",
  "your account will be", "verify immediately", "unusual activity",
  "has been compromised", "avoid charges", "expires today",
  "last chance", "failure to act", "suspended", "account locked"
];

const isPrivateAddress = (address) => {
  if (!address || typeof address !== "string") return true;

  const normalized = address.toLowerCase();
  const ipVersion = net.isIP(normalized);

  if (ipVersion === 4) {
    const [a, b] = normalized.split(".").map((value) => Number.parseInt(value, 10));
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (ipVersion === 6) {
    const words = parseIpv6Words(normalized);
    if (!words) return true;
    const firstFiveZero = words.slice(0, 5).every((word) => word === 0);
    if (firstFiveZero && words[5] === 0xffff) {
      return isPrivateAddress(ipv4FromIpv6Tail(words));
    }
    const ipv4Compatible = words.slice(0, 6).every((word) => word === 0);

    return (
      ipv4Compatible ||
      words.every((word) => word === 0) ||
      words.slice(0, 7).every((word) => word === 0) ||
      (words[0] & 0xfe00) === 0xfc00 ||
      (words[0] & 0xffc0) === 0xfe80 ||
      (words[0] & 0xffc0) === 0xfec0 ||
      (words[0] & 0xff00) === 0xff00 ||
      (words[0] === 0x0064 && words[1] === 0xff9b) ||
      words[0] === 0x2002 ||
      (words[0] === 0x2001 && words[1] === 0x0db8) ||
      (words[0] === 0x0100 && words.slice(1, 4).every((word) => word === 0))
    );
  }

  return false;
};

const isPrivateIp = async (hostname) => {
  if (!hostname || typeof hostname !== "string") return true;

  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (PRIVATE_HOSTNAMES.has(normalized)) return true;
  if (net.isIP(normalized)) return isPrivateAddress(normalized);

  try {
    const addresses = await dnsLookup(normalized, { all: true });
    return addresses.some(({ address }) => isPrivateAddress(address));
  } catch {
    return true;
  }
};

const resolvePublicAddress = async (hostname) => {
  const normalized = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!normalized || PRIVATE_HOSTNAMES.has(normalized)) {
    throw new Error(`Blocked private host: ${hostname}`);
  }

  if (net.isIP(normalized)) {
    if (isPrivateAddress(normalized)) throw new Error(`Blocked private IP: ${hostname}`);
    return { address: normalized, family: net.isIP(normalized) };
  }

  const addresses = await dnsLookup(normalized, { all: true, verbatim: true });
  if (!addresses.length) throw new Error(`No DNS address found for: ${hostname}`);
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`Blocked private DNS result: ${hostname}`);
  }
  return addresses[0];
};

const clientForProtocol = (protocol) => (protocol === "https:" ? https : http);

const safeGet = (targetUrl) =>
  new Promise(async (resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return reject(new Error(`Invalid URL: ${targetUrl}`));
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return reject(new Error(`Unsupported URL protocol: ${parsed.protocol}`));
    }

    let pinnedAddress;
    try {
      pinnedAddress = await resolvePublicAddress(parsed.hostname);
    } catch {
      return reject(new Error(`Could not verify host safety: ${parsed.hostname}`));
    }

    const lookup = (_hostname, _options, callback) => {
      callback(null, pinnedAddress.address, pinnedAddress.family);
    };
    const req = clientForProtocol(parsed.protocol).get(targetUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      family: pinnedAddress.family,
      lookup,
    }, (res) => {
      resolve(res);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.on("error", (err) => {
      reject(err);
    });
  });

const readResponseBody = (res, maxBytes = MAX_HTML_BYTES) =>
  new Promise((resolve, reject) => {
    let totalBytes = 0;
    const chunks = [];
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    };

    res.on("data", (chunk) => {
      if (resolved) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        finish();
        res.destroy();
        return;
      }
      chunks.push(chunk);
    });

    res.on("end", finish);
    res.on("error", reject);
  });

const followRedirects = async (url, maxHops = 5) => {
  const chain = [];
  let currentUrl = url;
  let timedOut = false;
  let html = null;

  for (let i = 0; i < maxHops; i += 1) {
    try {
      const res = await safeGet(currentUrl);
      const statusCode = res.statusCode || 0;
      chain.push({ url: currentUrl, statusCode });

      const contentType = String(res.headers["content-type"] || "").toLowerCase();
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        res.resume();
        currentUrl = new URL(res.headers.location, currentUrl).href;
      } else {
        if (contentType.includes("text/html")) {
          html = await readResponseBody(res);
        } else {
          res.resume();
        }
        break;
      }
    } catch (err) {
      if (err.message === "Request timed out") {
        timedOut = true;
      }
      chain.push({ url: currentUrl, statusCode: 0, error: err.message });
      break;
    }
  }

  return {
    chain,
    finalUrl: chain.length > 0 ? chain[chain.length - 1].url : url,
    hopCount: chain.length,
    timedOut,
    html,
  };
};

const extractDomain = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

const detectCredentialForms = (html, pageUrl) => {
  const details = [];
  const pageDomain = extractDomain(pageUrl);
  const formRegex = /<form[\s\S]*?<\/form>/gi;
  let match;

  while ((match = formRegex.exec(html)) !== null) {
    const form = match[0];
    const actionMatch = form.match(/action\s*=\s*["']([^"']+)["']/i);
    if (actionMatch) {
      const actionDomain = extractDomain(actionMatch[1]);
      if (actionDomain && actionDomain !== pageDomain) {
        details.push(`Form submits to external domain: ${actionDomain} (page: ${pageDomain})`);
      }
    }

    if (/type\s*=\s*["']password["']/i.test(form)) {
      details.push("Form contains a password input field");
    }

    if (
      /name\s*=\s*["'][^"']*(card|cc[-_]?num|credit)/i.test(form) ||
      /autocomplete\s*=\s*["']cc-number["']/i.test(form)
    ) {
      details.push("Form contains a credit card input field");
    }
  }

  return { found: details.length > 0, details };
};

const checkTitleDomainMismatch = (html, pageUrl) => {
  const details = [];
  const pageDomain = extractDomain(pageUrl);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return { found: false, details };

  const titleText = titleMatch[1].toLowerCase().trim();
  for (const brand of KNOWN_BRANDS) {
    if (titleText.includes(brand) && !pageDomain.includes(brand)) {
      details.push(`Title references "${brand}" but domain is "${pageDomain}"`);
    }
  }

  return { found: details.length > 0, details };
};

const detectHiddenElements = (html) => {
  const details = [];
  const hiddenIframes = html.match(/<iframe[^>]*(?:hidden|display\s*:\s*none|width\s*=\s*["']0|height\s*=\s*["']0)[^>]*>/gi);
  if (hiddenIframes?.length > 0) {
    details.push(`Found ${hiddenIframes.length} suspicious hidden iframe(s)`);
  }

  const hiddenDivRegex = /<(?:div|span|section)[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>[\s\S]*?<form[\s\S]*?<\/form>/gi;
  const hiddenForms = html.match(hiddenDivRegex);
  if (hiddenForms?.length > 0) {
    details.push(`Found ${hiddenForms.length} hidden element(s) containing forms`);
  }

  return { found: details.length > 0, details };
};

const checkUrgencyText = (html) => {
  const details = [];
  const textContent = html.replace(/<[^>]+>/g, " ").toLowerCase();
  
  for (const phrase of URGENCY_PHRASES) {
    if (textContent.includes(phrase)) {
      details.push(`Page contains urgency/pressure phrase: "${phrase}"`);
    }
  }
  
  return { found: details.length > 0, details: details.slice(0, 3) };
};

const analyzePageContent = (html, pageUrl) => {
  const safe = {
    hasCredentialHarvester: false,
    hasTitleMismatch: false,
    hasHiddenElements: false,
    hasUrgency: false,
    details: [],
  };

  if (!html || typeof html !== "string" || !pageUrl || typeof pageUrl !== "string") {
    return safe;
  }

  try {
    const cred = detectCredentialForms(html, pageUrl);
    const title = checkTitleDomainMismatch(html, pageUrl);
    const hidden = detectHiddenElements(html);
    const urgency = checkUrgencyText(html);

    return {
      hasCredentialHarvester: cred.found,
      hasTitleMismatch: title.found,
      hasHiddenElements: hidden.found,
      hasUrgency: urgency.found,
      details: [...cred.details, ...title.details, ...hidden.details, ...urgency.details],
    };
  } catch {
    return safe;
  }
};

const expandShortUrl = async (url) => {
  const result = { isShortened: false, originalUrl: url, expandedUrl: null };
  if (!url || typeof url !== "string") return result;

  const domain = extractDomain(url);
  if (!SHORTENER_DOMAINS.has(domain)) return result;

  result.isShortened = true;
  try {
    const { finalUrl } = await followRedirects(url, 5);
    result.expandedUrl = finalUrl !== url ? finalUrl : null;
  } catch {
    // Leave expandedUrl null.
  }

  return result;
};

module.exports = {
  followRedirects,
  analyzePageContent,
  expandShortUrl,
  isPrivateIp,
};

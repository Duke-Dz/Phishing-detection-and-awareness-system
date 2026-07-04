const config = require("../config/env");

const brand = {
  name: "CyberSense",
  navy: "#0b1220",
  blue: "#2563eb",
  text: "#172033",
  muted: "#5c667a",
  border: "#dbe2ee",
  background: "#f3f6fb",
  success: "#16794b",
  warning: "#a15c00",
  danger: "#b42318",
  logoCid: "cybersense-logo",
};

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const safeUrl = (value = "") => {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
};

const button = (url, label) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td style="border-radius:8px;background:${brand.blue}"><a href="${safeUrl(url)}" style="display:inline-block;padding:13px 22px;color:#fff;text-decoration:none;font-size:15px;line-height:20px;font-weight:700;border-radius:8px">${escapeHtml(label)}</a></td></tr></table>`;

const alert = (message, tone = "info") => {
  const colors = { info: brand.blue, success: brand.success, warning: brand.warning, danger: brand.danger };
  return `<div style="margin:22px 0;padding:15px 17px;border:1px solid ${brand.border};border-left:4px solid ${colors[tone]};border-radius:7px;background:#f8fafc;color:${brand.text};font-size:14px;line-height:1.6">${escapeHtml(message)}</div>`;
};

const details = (rows = []) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border:1px solid ${brand.border};border-radius:8px;border-collapse:separate">${rows.filter((row) => row?.[1] !== undefined && row?.[1] !== null).map(([label, value]) => `<tr><td style="padding:11px 14px;border-bottom:1px solid ${brand.border};color:${brand.muted};font-size:13px;width:34%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:11px 14px;border-bottom:1px solid ${brand.border};color:${brand.text};font-size:13px;font-weight:600;word-break:break-word">${escapeHtml(value)}</td></tr>`).join("")}</table>`;

const list = (items = []) => items.length
  ? `<ul style="margin:18px 0;padding-left:22px;color:${brand.text};font-size:14px;line-height:1.7">${items.map((item) => `<li style="margin-bottom:7px">${escapeHtml(item)}</li>`).join("")}</ul>`
  : "";

const brandHeader = () => `<tr><td style="padding:22px 32px;text-align:center;background:#fff;border-bottom:1px solid ${brand.border}"><img src="cid:${brand.logoCid}" width="190" alt="${brand.name}" style="display:block;width:190px;max-width:100%;height:auto;margin:0 auto;border:0"></td></tr>`;

const layout = ({ title, preheader, body }) => {
  const hiddenPreview = `${escapeHtml(preheader || title)}${"&nbsp;&zwnj;".repeat(30)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(title)}</title><style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding:24px 20px!important}.email-outer{padding:12px 8px!important}.email-footer{padding:20px!important}}</style></head><body style="margin:0;padding:0;background:${brand.background};font-family:Arial,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased"><div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${hiddenPreview}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${brand.background}"><tr><td class="email-outer" style="padding:32px 12px"><table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" align="center" style="width:600px;max-width:600px;margin:0 auto;background:#fff;border:1px solid ${brand.border};border-radius:10px;overflow:hidden">${brandHeader()}<tr><td class="email-pad" style="padding:34px 32px"><h1 style="margin:0 0 18px;color:${brand.text};font-size:24px;line-height:31px;font-weight:700;letter-spacing:-.01em">${escapeHtml(title)}</h1>${body}</td></tr><tr><td class="email-footer" style="padding:22px 32px;border-top:1px solid ${brand.border};background:#f8fafc;color:${brand.muted};font-size:11px;line-height:18px"><strong style="color:${brand.text}">CyberSense Security</strong><br>This message was sent in connection with your CyberSense account or security activity.<br>Questions? Contact ${escapeHtml(config.mail.support)}.<div style="margin-top:12px"><a href="{{PRIVACY_URL}}" style="color:${brand.blue};text-decoration:underline">Privacy policy</a><span style="color:#aab3c2"> &nbsp;·&nbsp; </span><a href="{{UNSUBSCRIBE_URL}}" style="color:${brand.blue};text-decoration:underline">Unsubscribe from non-essential emails</a></div><div style="margin-top:10px;color:#8a94a6">Account and critical security messages may still be sent when necessary.</div></td></tr></table></td></tr></table></body></html>`;
};

const greeting = (name) => `<p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:24px">Hello ${escapeHtml(name || "there")},</p>`;
const paragraph = (text) => `<p style="margin:0 0 16px;color:${brand.text};font-size:14px;line-height:23px">${escapeHtml(text)}</p>`;

module.exports = { alert, brand, button, details, escapeHtml, greeting, layout, list, paragraph, safeUrl };

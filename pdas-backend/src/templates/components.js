const config = require("../config/env");

const brand = {
  name: "CyberSense",
  navy: "#101828",
  blue: "#175CD3",
  text: "#182230",
  muted: "#667085",
  subtle: "#F9FAFB",
  border: "#E4E7EC",
  background: "#F2F4F7",
  panel: "#FFFFFF",
  success: "#067647",
  warning: "#B54708",
  danger: "#B42318",
  logoCid: "cybersense-logo",
};

const tones = {
  info: { accent: brand.blue, soft: "#EFF8FF", label: "CyberSense notification" },
  success: { accent: brand.success, soft: "#ECFDF3", label: "Activity confirmed" },
  warning: { accent: brand.warning, soft: "#FFFAEB", label: "Review recommended" },
  danger: { accent: brand.danger, soft: "#FEF3F2", label: "Security alert" },
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

const button = (url, label) => {
  const href = safeUrl(url);
  const text = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 8px"><tr><td style="border-radius:8px;background:${brand.blue};text-align:center"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:44px;v-text-anchor:middle;width:210px" arcsize="18%" stroke="f" fillcolor="${brand.blue}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold"><![endif]--><a href="${href}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;line-height:20px;font-weight:700;border-radius:8px;mso-hide:all">${text}</a><!--[if mso]></center></v:roundrect><![endif]--></td></tr></table>`;
};

const alert = (message, tone = "info") => {
  const palette = tones[tone] || tones.info;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:${palette.soft};border:1px solid ${palette.accent};border-radius:8px"><tr><td style="width:4px;background:${palette.accent};font-size:0;line-height:0">&nbsp;</td><td style="padding:13px 15px;color:${brand.text};font-size:14px;line-height:22px">${escapeHtml(message)}</td></tr></table>`;
};

const details = (rows = []) => {
  const visibleRows = rows.filter((row) => row?.[1] !== undefined && row?.[1] !== null);
  if (!visibleRows.length) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border:1px solid ${brand.border};border-radius:8px;border-collapse:separate;overflow:hidden">${visibleRows.map(([label, value], index) => `<tr><td class="detail-label" style="padding:11px 14px;border-bottom:${index === visibleRows.length - 1 ? "0" : `1px solid ${brand.border}`};color:${brand.muted};font-size:12px;line-height:18px;width:32%;vertical-align:top;background:${brand.subtle};text-transform:uppercase;letter-spacing:.35px">${escapeHtml(label)}</td><td class="detail-value" style="padding:11px 14px;border-bottom:${index === visibleRows.length - 1 ? "0" : `1px solid ${brand.border}`};color:${brand.text};font-size:13px;line-height:20px;font-weight:600;word-break:break-word">${escapeHtml(value)}</td></tr>`).join("")}</table>`;
};

const list = (items = []) => items.length
  ? `<ul style="margin:18px 0;padding-left:20px;color:${brand.text};font-size:14px;line-height:23px">${items.map((item) => `<li style="margin-bottom:7px;padding-left:2px">${escapeHtml(item)}</li>`).join("")}</ul>`
  : "";

const brandHeader = () => `<tr><td style="padding:17px 32px;background:#ffffff;border-bottom:1px solid ${brand.border}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="vertical-align:middle"><img src="cid:${brand.logoCid}" width="142" alt="${brand.name}" style="display:block;width:142px;max-width:100%;height:auto;border:0"></td><td class="header-label" align="right" style="vertical-align:middle;color:${brand.muted};font-size:11px;line-height:16px;font-weight:700;text-transform:uppercase;letter-spacing:.8px">Security communications</td></tr></table></td></tr>`;

const footer = (essential) => `<tr><td class="email-footer" style="padding:22px 32px;border-top:1px solid ${brand.border};background:${brand.subtle};color:${brand.muted};font-size:11px;line-height:18px"><strong style="color:${brand.text};font-size:12px">CyberSense Security Team</strong><br>This email relates to your CyberSense account or security activity.<br>Questions? Contact ${escapeHtml(config.mail.support)}.<div style="margin-top:12px"><a href="{{PRIVACY_URL}}" style="color:${brand.blue};text-decoration:underline">Privacy policy</a>${essential ? "" : `<span style="color:#98A2B3"> &nbsp;|&nbsp; </span><a href="{{UNSUBSCRIBE_URL}}" style="color:${brand.blue};text-decoration:underline">Email preferences</a>`}</div><div style="margin-top:10px;color:#98A2B3">CyberSense will never ask for your password or verification code by email.</div></td></tr>`;

const layout = ({ title, preheader, body, tone = "info", essential = false }) => {
  const palette = tones[tone] || tones.info;
  const hiddenPreview = `${escapeHtml(preheader || title)}${"&nbsp;&zwnj;".repeat(30)}`;
  return `<!doctype html><html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(title)}</title><style>@media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding:24px 20px!important}.email-outer{padding:10px 6px!important}.email-footer{padding:20px!important}.hero-pad{padding:24px 20px!important}.header-label{display:none!important}.detail-label,.detail-value{display:block!important;width:auto!important}.detail-label{border-bottom:0!important;padding-bottom:2px!important}.detail-value{padding-top:2px!important}}</style></head><body style="margin:0;padding:0;background:${brand.background};font-family:Arial,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased"><div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all">${hiddenPreview}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${brand.background}"><tr><td class="email-outer" style="padding:28px 12px"><table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" align="center" style="width:600px;max-width:600px;margin:0 auto;background:${brand.panel};border:1px solid ${brand.border};border-radius:12px;overflow:hidden">${brandHeader()}<tr><td class="hero-pad" style="padding:28px 32px 26px;background:${palette.soft};border-top:3px solid ${palette.accent};border-bottom:1px solid ${brand.border}"><div style="margin:0 0 8px;color:${palette.accent};font-size:11px;line-height:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px">${escapeHtml(palette.label)}</div><h1 style="margin:0;color:${brand.navy};font-size:26px;line-height:34px;font-weight:700">${escapeHtml(title)}</h1>${preheader ? `<p style="margin:10px 0 0;color:${brand.muted};font-size:14px;line-height:22px">${escapeHtml(preheader)}</p>` : ""}</td></tr><tr><td class="email-pad" style="padding:30px 32px 32px">${body}</td></tr>${footer(essential)}</table></td></tr></table></body></html>`;
};

const greeting = (name) => `<p style="margin:0 0 16px;color:${brand.text};font-size:15px;line-height:24px">Hello ${escapeHtml(name || "there")},</p>`;
const paragraph = (text) => `<p style="margin:0 0 16px;color:${brand.text};font-size:14px;line-height:23px">${escapeHtml(text)}</p>`;

module.exports = { alert, brand, button, details, escapeHtml, greeting, layout, list, paragraph, safeUrl };

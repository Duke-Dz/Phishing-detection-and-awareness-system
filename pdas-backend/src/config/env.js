require("dotenv").config({ quiet: true });

const required = [
  "PORT",
  "JWT_SECRET",
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number.parseInt(process.env.PORT, 10),
  nodeEnv: process.env.NODE_ENV,
  db: {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true",
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshTokenExpiresDays: Number.parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10),
  },
  https: {
    enabled: process.env.HTTPS_ENABLED === "true",
    force: process.env.FORCE_HTTPS === "true",
    keyPath: process.env.HTTPS_KEY_PATH,
    certPath: process.env.HTTPS_CERT_PATH,
  },
  mfa: {
    issuer: process.env.MFA_ISSUER || "CyberSense",
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: Number.parseInt(process.env.MAIL_PORT || "587", 10),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || "CyberSense Security <noreply@cybersense.local>",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  passwordResetTokenExpiryMinutes: Number.parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || "60", 10),
  emailVerificationTokenExpiryHours: Number.parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS || "24", 10),
  apis: {
    googleSafeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY || "",
    virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY || "",
  },
};

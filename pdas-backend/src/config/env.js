// src/config/env.js

// We import dotenv here as a safety net in case this file
// is loaded before server.js calls dotenv.config()
require("dotenv").config();

// Define which environment variables are REQUIRED to run this app
const required = [
  "PORT",
  "JWT_SECRET",
  "DB_HOST",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

// Loop through every required variable
// process.env is a Node.js built-in object — it holds all environment variables
// as key-value string pairs
required.forEach((key) => {
  if (!process.env[key]) {
    // Throwing an error here stops the entire process from starting
    // This is intentional — a misconfigured app should NOT run silently
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Export a clean config object so the rest of the app
// uses this instead of accessing process.env directly everywhere
// This makes it easy to see ALL config in one place
module.exports = {
  port: parseInt(process.env.PORT, 10), // parseInt converts "5000" string to number 5000
  nodeEnv: process.env.NODE_ENV,
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true",
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10),
  },
  https: {
    enabled: process.env.HTTPS_ENABLED === "true",
    force: process.env.FORCE_HTTPS === "true",
    keyPath: process.env.HTTPS_KEY_PATH,
    certPath: process.env.HTTPS_CERT_PATH,
  },
  mfa: {
    issuer: process.env.MFA_ISSUER || "PDAS",
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
<<<<<<< HEAD
    from: process.env.MAIL_FROM || "PDAS Security <noreply@pdas.local>",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  passwordResetTokenExpiryMinutes: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || "60", 10),
  emailVerificationTokenExpiryHours: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS || "24", 10),
=======
  },
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
  // Optional API keys — system works without them (graceful degradation)
  apis: {
    googleSafeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY || "",
    virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY || "",
  },
};

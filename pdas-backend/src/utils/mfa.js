const crypto = require("crypto");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (buffer) => {
  let bits = "";
  let output = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += ALPHABET[parseInt(chunk, 2)];
  }

  return output;
};

const base32Decode = (secret) => {
  const cleanSecret = String(secret || "").replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";

  for (const char of cleanSecret) {
    const value = ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error("Invalid MFA secret");
    }
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
};

const generateMfaSecret = () => base32Encode(crypto.randomBytes(20));

const generateTotp = (secret, timeStep = Math.floor(Date.now() / 30000)) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(timeStep));

  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1000000).padStart(6, "0");
};

const verifyTotp = (secret, code, window = 1) => {
  const value = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(value)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 30000);
  for (let offset = -window; offset <= window; offset += 1) {
    if (generateTotp(secret, currentStep + offset) === value) {
      return true;
    }
  }

  return false;
};

const buildOtpAuthUrl = (user, secret) => {
  const issuer = encodeURIComponent(process.env.MFA_ISSUER || "CyberSense");
  const label = encodeURIComponent(`${process.env.MFA_ISSUER || "CyberSense"}:${user.email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
};

module.exports = {
  buildOtpAuthUrl,
  generateTotp,
  generateMfaSecret,
  verifyTotp,
};

const crypto = require("crypto");

const generateToken = () => crypto.randomBytes(32).toString("hex");

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { generateToken, generateOtp, hashToken };

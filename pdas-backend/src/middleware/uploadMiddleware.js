const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { createError } = require("../utils/validators");

// Ensure upload directories exist
const uploadDirs = ["uploads/avatars", "uploads/reports"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.originalUrl.includes("/avatar")) {
      cb(null, "uploads/avatars");
    } else {
      cb(null, "uploads/reports");
    }
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uuid}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const imageMimes = ["image/jpeg", "image/png", "image/webp"];
  const reportMimes = [...imageMimes, "application/pdf", "message/rfc822"];
  const originalName = String(file.originalname || "").toLowerCase();
  const isAvatarUpload = req.originalUrl.includes("/avatar");
  const allowedMimes = isAvatarUpload ? imageMimes : reportMimes;
  const isAllowedReportEmail = !isAvatarUpload && originalName.endsWith(".eml");

  if (allowedMimes.includes(file.mimetype) || isAllowedReportEmail) {
    cb(null, true);
  } else {
    const message = isAvatarUpload
      ? "Invalid file type. Only JPG, PNG, and WEBP are allowed."
      : "Invalid file type. Only JPG, PNG, WEBP, PDF, and EML are allowed.";
    cb(createError(message, 400), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = upload;

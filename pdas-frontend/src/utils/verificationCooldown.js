const VERIFICATION_PREFIX = "cybersense_verification_resend_at:";
const PASSWORD_RESET_PREFIX = "cybersense_password_reset_resend_at:";

const keyFor = (prefix, email) => `${prefix}${String(email || "").trim().toLowerCase()}`;
export const setVerificationCooldown = (email, seconds = 120) => {
  if (!email) return 0;
  const availableAt = Date.now() + Math.max(0, Number(seconds) || 0) * 1000;
  localStorage.setItem(keyFor(VERIFICATION_PREFIX, email), String(availableAt));
  return availableAt;
};

export const getVerificationCooldown = (email) => {
  if (!email) return 0;
  const availableAt = Number(localStorage.getItem(keyFor(VERIFICATION_PREFIX, email))) || 0;
  return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
};

export const clearVerificationCooldown = (email) => {
  if (email) localStorage.removeItem(keyFor(VERIFICATION_PREFIX, email));
};


export const setPasswordResetCooldown = (email, seconds = 60) => {
  if (!email) return 0;
  const availableAt = Date.now() + Math.max(0, Number(seconds) || 0) * 1000;
  localStorage.setItem(keyFor(PASSWORD_RESET_PREFIX, email), String(availableAt));
  return availableAt;
};

export const getPasswordResetCooldown = (email) => {
  if (!email) return 0;
  const availableAt = Number(localStorage.getItem(keyFor(PASSWORD_RESET_PREFIX, email))) || 0;
  return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
};

export const clearPasswordResetCooldown = (email) => {
  if (email) localStorage.removeItem(keyFor(PASSWORD_RESET_PREFIX, email));
};
export const formatCooldown = (seconds) => {
  const value = Math.max(0, Math.ceil(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainingSeconds = value % 60;
  const parts = [];

  if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  if (!hours && remainingSeconds) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`);
  }

  return parts.length ? parts.join(" ") : "0 seconds";
};

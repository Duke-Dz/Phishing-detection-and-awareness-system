const PREFIX = "cybersense_verification_resend_at:";

const keyFor = (email) => `${PREFIX}${String(email || "").trim().toLowerCase()}`;

export const setVerificationCooldown = (email, seconds = 120) => {
  if (!email) return 0;
  const availableAt = Date.now() + Math.max(0, Number(seconds) || 0) * 1000;
  localStorage.setItem(keyFor(email), String(availableAt));
  return availableAt;
};

export const getVerificationCooldown = (email) => {
  if (!email) return 0;
  const availableAt = Number(localStorage.getItem(keyFor(email))) || 0;
  return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
};

export const clearVerificationCooldown = (email) => {
  if (email) localStorage.removeItem(keyFor(email));
};

export const formatCooldown = (seconds) => {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const remainder = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

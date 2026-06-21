import { PASSWORD_RULES } from "./constants";

export const evaluatePassword = (password = "", context = {}) => {
  const checks = [
    {
      id: "length",
      label: `At least ${PASSWORD_RULES.minLength} characters`,
      passed: password.length >= PASSWORD_RULES.minLength,
    },
    {
      id: "max-length",
      label: `No more than ${PASSWORD_RULES.maxLength} characters`,
      passed: password.length <= PASSWORD_RULES.maxLength,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      passed: /[A-Z]/.test(password),
      enabled: PASSWORD_RULES.requireUppercase,
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      passed: /[a-z]/.test(password),
      enabled: PASSWORD_RULES.requireLowercase,
    },
    {
      id: "number",
      label: "One number",
      passed: /[0-9]/.test(password),
      enabled: PASSWORD_RULES.requireNumber,
    },
    {
      id: "special",
      label: "One special character",
      passed: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      enabled: PASSWORD_RULES.requireSpecial,
    },
  ].filter((check) => check.enabled !== false);

  const score = checks.filter((c) => c.passed).length;
  const valid = checks.every((c) => c.passed);

  return { score, valid, checks };
};

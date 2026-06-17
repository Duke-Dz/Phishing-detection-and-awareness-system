import { PASSWORD_RULES } from "./constants";

export const evaluatePassword = (password = "", context = {}) => {
  const checks = [
    {
      id: "length",
      label: `At least ${PASSWORD_RULES.minLength} characters`,
      passed: password.length >= PASSWORD_RULES.minLength,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      passed: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "One special character",
      passed: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const score = checks.filter((c) => c.passed).length;
  const valid = checks.every((c) => c.passed);

  return { score, valid, checks };
};

export const ROLES = {
  USER: "user",
  ANALYST: "analyst",
  ADMIN: "admin",
};

export const ROLE_DESTINATIONS = {
  [ROLES.ADMIN]: "/admin",
  [ROLES.ANALYST]: "/analyst",
  [ROLES.USER]: "/dashboard",
};

export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

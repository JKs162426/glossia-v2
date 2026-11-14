// Mirrors the server-side rules in server/src/middleware/validators.js
export const PASSWORD_RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "A letter", test: (p) => /[a-zA-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];

export const meetsPasswordRules = (password) => PASSWORD_RULES.every((rule) => rule.test(password));

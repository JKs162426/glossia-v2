import { rateLimit } from "express-rate-limit";

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });

// Brute-force protection on credentials; successful logins don't count.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Deleting the account asks for the password: same protection as login, so
// someone with a stolen session can't guess it.
export const deleteAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in 15 minutes." },
});

// Every request sends an email, so it's limited per IP and per address:
// nobody can flood someone's inbox with reset links from many IPs.
export const forgotPasswordLimiter = limiter(
  15,
  5,
  "Too many requests. Try again in 15 minutes.",
);
export const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  // After the validators, so the address is already trimmed and lowercased.
  keyGenerator: (req) => req.body.email,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests for this email. Try again in an hour." },
});

// The token is 256 random bits, so this isn't about guessing it: it caps the
// bcrypt work (cost 12) of failed attempts. It runs after validation, so
// malformed tokens (rejected for free) don't count, and successful resets
// need a real token, which forgot-password already limits.
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in 15 minutes." },
});

export const registerLimiter = limiter(
  60,
  10,
  "Too many accounts created. Try again later.",
);

export const apiLimiter = limiter(1, 300, "Too many requests. Slow down.");

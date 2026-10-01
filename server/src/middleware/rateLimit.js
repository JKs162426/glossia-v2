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

export const registerLimiter = limiter(
  60,
  10,
  "Too many accounts created. Try again later.",
);

export const apiLimiter = limiter(1, 300, "Too many requests. Slow down.");

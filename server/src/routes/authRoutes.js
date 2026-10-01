import express from "express";
import passport from "passport";
import config from "../config/env.js";
import {
  register,
  login,
  logout,
  getMe,
  googleCallback,
} from "../controllers/authController.js";
import {
  registerValidators,
  loginValidators,
} from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Email/password auth
router.post(
  "/register",
  registerLimiter,
  registerValidators,
  validate,
  register,
);
router.post("/login", loginLimiter, loginValidators, validate, login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

// Google OAuth
const googleFailure = `${config.clientUrl}/login?error=google`;

router.get("/google", (req, res, next) => {
  if (!config.googleEnabled) return res.redirect(googleFailure);
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
});

router.get(
  "/google/callback",
  (req, res, next) =>
    config.googleEnabled ? next() : res.redirect(googleFailure),
  passport.authenticate("google", {
    session: false,
    failureRedirect: googleFailure,
  }),
  googleCallback,
);

export default router;

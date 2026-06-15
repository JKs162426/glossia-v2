import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, login } from "../controllers/authController.js";
import {
  registerValidators,
  loginValidators,
} from "../middleware/authValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Email/password auth
router.post("/register", registerValidators, validate, register);
router.post("/login", loginValidators, validate, login);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login",
    failureMessage: true,
  }),
  (req, res) => {
    console.log("Google user:", req.user);
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = encodeURIComponent(
      JSON.stringify({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      })
    );

    res.redirect(
      `http://localhost:5173/auth/callback?token=${token}&user=${user}`
    );
  }
);

export default router;

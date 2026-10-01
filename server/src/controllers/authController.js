import bcrypt from "bcryptjs";
import config from "../config/env.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  usernameExists,
} from "../models/userModel.js";
import {
  setAuthCookie,
  clearAuthCookie,
  publicUser,
} from "../utils/authToken.js";

const BCRYPT_ROUNDS = 12;

// Compared against when the email doesn't exist, so a failed login takes the
// same time either way and can't be used to discover registered emails.
const DUMMY_HASH = bcrypt.hashSync("glossia-timing-guard", BCRYPT_ROUNDS);

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (await findUserByEmail(email)) {
    return res.status(409).json({ message: "Email already in use" });
  }
  if (await usernameExists(username)) {
    return res.status(409).json({ message: "Username already taken" });
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId = await createUser(username, email, hashedPassword);
  const user = await findUserById(userId);

  setAuthCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (user && !user.password) {
    return res.status(400).json({
      message: "This account uses Google sign-in. Continue with Google.",
    });
  }

  const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  setAuthCookie(res, user);
  res.json({ user: publicUser(user) });
};

export const logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
};

export const googleCallback = (req, res) => {
  setAuthCookie(res, req.user);
  // No token in the URL: it would end up in browser history and server logs.
  res.redirect(`${config.clientUrl}/auth/callback`);
};

export const getMe = async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "Account no longer exists" });
  }
  res.json({ user: publicUser(user) });
};

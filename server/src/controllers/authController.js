import bcrypt from "bcryptjs";
import config from "../config/env.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  revokeSessions,
  usernameExists,
} from "../models/userModel.js";
import {
  setAuthCookie,
  clearAuthCookie,
  publicUser,
  tokenFrom,
  verifyToken,
} from "../utils/authToken.js";
import { createPasswordReset, resetPasswordWithToken } from "../models/passwordResetModel.js";
import { INVALID_RESET_LINK } from "../middleware/validators.js";
import { sendMail } from "../services/mailer.js";
import { passwordChangedEmail, passwordResetEmail } from "../services/emails.js";

const BCRYPT_ROUNDS = 12;

export const FORGOT_PASSWORD_MESSAGE =
  "If there's an account with that email, we've sent it a link to choose a new password.";

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
  let userId;
  try {
    userId = await createUser(username, email, hashedPassword);
  } catch (err) {
    // Two sign-ups with the same email or username at once both pass the
    // checks above; the unique key stops the second one here.
    if (err.code !== "ER_DUP_ENTRY") throw err;
    const field = /for key '(?:users\.)?(\w+)'/.exec(err.sqlMessage)?.[1];
    return res
      .status(409)
      .json({ message: field === "username" ? "Username already taken" : "Email already in use" });
  }
  const user = await findUserById(userId);

  setAuthCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  // Unknown emails and Google accounts (no password) get the same answer and
  // the same bcrypt delay as a wrong password, so neither reveals the email.
  // DUMMY_HASH's plain text is public, so a match on it must never count.
  const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user?.password || !isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  setAuthCookie(res, user);
  res.json({ user: publicUser(user) });
};

// Bumps the user's token_version so this token, and every other one issued
// before it (other devices, a copied cookie), stops working. A missing,
// forged or already revoked token has nothing to revoke: the cookie is
// cleared all the same.
export const logout = async (req, res) => {
  const token = tokenFrom(req);
  let payload = null;
  if (token) {
    try {
      payload = verifyToken(token);
    } catch {
      // Expired or forged.
    }
  }
  if (payload) await revokeSessions(payload.id, payload.ver ?? 0);

  clearAuthCookie(res);
  res.json({ message: "Logged out" });
};

const sendResetLink = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) return;
  const token = await createPasswordReset(user.id);
  // In the fragment (#), not the query: browsers never send it to a server,
  // so the token stays out of access logs and Referer headers.
  const link = `${config.clientUrl}/reset-password#token=${token}`;
  await sendMail(passwordResetEmail({ to: user.email, username: user.username, link }));
};

// The answer goes out before looking anything up, so neither its content nor
// its timing tells whether the email has an account. Google accounts get a
// link too: it lets them add a password.
export const forgotPassword = async (req, res) => {
  res.status(202).json({ message: FORGOT_PASSWORD_MESSAGE });
  try {
    await sendResetLink(req.body.email);
  } catch (err) {
    console.error("Password reset email failed:", err.message);
  }
};

// One-use link: sets the new password and logs out every device (the
// browser that used it included, so it signs in with the new password).
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId = await resetPasswordWithToken(token, passwordHash);
  if (!userId) return res.status(400).json({ message: INVALID_RESET_LINK });

  clearAuthCookie(res);
  res.json({ message: "Password updated" });

  try {
    const user = await findUserById(userId);
    const forgotLink = `${config.clientUrl}/forgot-password`;
    await sendMail(passwordChangedEmail({ to: user.email, username: user.username, forgotLink }));
  } catch (err) {
    console.error("Password changed email failed:", err.message);
  }
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

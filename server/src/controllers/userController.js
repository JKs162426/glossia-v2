import bcrypt from "bcryptjs";
import {
  updateTargetLanguage,
  findUserById,
  findPasswordHash,
  deleteUser,
} from "../models/userModel.js";
import { clearAuthCookie, publicUser } from "../utils/authToken.js";

// A Google account has no password to confirm with, so it must have signed
// in with Google this recently instead.
const GOOGLE_REAUTH_SECONDS = 10 * 60;

export const setLanguage = async (req, res) => {
  await updateTargetLanguage(req.user.id, req.body.language);
  const user = await findUserById(req.user.id);
  res.json({ user: publicUser(user) });
};

// 403, not 401: the session is fine, and the client logs out on any 401.
export const deleteAccount = async (req, res) => {
  const hash = await findPasswordHash(req.user.id);

  if (hash) {
    const { password } = req.body;
    if (!password || !(await bcrypt.compare(password, hash))) {
      return res.status(403).json({ message: "Incorrect password" });
    }
  } else {
    const secondsSinceSignIn = Date.now() / 1000 - req.user.signedInAt;
    if (secondsSinceSignIn > GOOGLE_REAUTH_SECONDS) {
      return res.status(403).json({
        message: "Sign in with Google again to delete your account.",
        reauth: true,
      });
    }
  }

  await deleteUser(req.user.id);
  clearAuthCookie(res);
  res.status(204).end();
};

import { tokenFrom, verifyToken } from "../utils/authToken.js";
import { findSessionUser } from "../models/userModel.js";

const invalidSession = (res) =>
  res.status(401).json({ message: "Invalid or expired session" });

// A valid signature isn't enough: the user must still exist and the token
// must carry their current token_version (logging out bumps it). Tokens from
// before versions existed have no `ver` and count as version 0.
const authMiddleware = async (req, res, next) => {
  const token = tokenFrom(req);
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return invalidSession(res);
  }

  const user = await findSessionUser(payload.id);
  if (!user || (payload.ver ?? 0) !== user.token_version) {
    return invalidSession(res);
  }

  // signedInAt (seconds): tokens are only issued at sign-in, so it's when
  // the user last proved who they are.
  req.user = { id: user.id, username: user.username, signedInAt: payload.iat };
  next();
};

export default authMiddleware;

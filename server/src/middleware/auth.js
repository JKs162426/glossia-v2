import { AUTH_COOKIE, verifyToken } from "../utils/authToken.js";

const authMiddleware = (req, res, next) => {
  // Cookie for the web client; Bearer header kept for API tools like test.http.
  const header = req.headers.authorization;
  const token =
    req.cookies?.[AUTH_COOKIE] ||
    (header?.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const { id, username } = verifyToken(token);
    req.user = { id, username };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
};

export default authMiddleware;

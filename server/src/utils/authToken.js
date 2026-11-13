import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const AUTH_COOKIE = "glossia_token";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: "lax",
  path: "/",
};

// `ver` is the user's token_version when the token was issued; logging out
// bumps it, and the auth middleware rejects tokens with an older one.
export const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, ver: user.token_version ?? 0 },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn, algorithm: "HS256" },
  );

export const verifyToken = (token) =>
  jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });

// Cookie for the web client; Bearer header kept for API tools like test.http.
export const tokenFrom = (req) => {
  const header = req.headers.authorization;
  return (
    req.cookies?.[AUTH_COOKIE] ||
    (header?.startsWith("Bearer ") ? header.slice(7) : null)
  );
};

// The token lives in an httpOnly cookie so page scripts (and any XSS) can't read it.
export const setAuthCookie = (res, user) => {
  res.cookie(AUTH_COOKIE, signToken(user), {
    ...cookieOptions,
    maxAge: SEVEN_DAYS_MS,
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
};

// findUserById gives has_password; findUserByEmail gives the hash itself.
export const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  target_language: user.target_language || "es",
  has_password: Boolean(user.has_password ?? user.password),
});

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

export const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: "HS256",
  });

export const verifyToken = (token) =>
  jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });

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

export const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  target_language: user.target_language || "es",
});

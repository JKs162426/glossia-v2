import crypto from "node:crypto";
import config from "../config/env.js";

const COOKIE = "glossia_oauth_state";

const cookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  // Lax still sends the cookie on Google's top-level redirect back to us.
  sameSite: "lax",
  path: "/api/auth/google",
};

// OAuth "state" kept in a short-lived cookie instead of a server session:
// nothing is stored in memory, so it works across restarts and instances.
// Interface expected by passport-oauth2: store(req, cb) / verify(req, state, cb).
export const cookieStateStore = {
  store(req, callback) {
    const state = crypto.randomBytes(24).toString("hex");
    req.res.cookie(COOKIE, state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
    callback(null, state);
  },

  verify(req, state, callback) {
    const expected = req.cookies?.[COOKIE];
    req.res.clearCookie(COOKIE, cookieOptions);

    const valid =
      typeof state === "string" &&
      typeof expected === "string" &&
      state.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected));

    if (!valid) {
      return callback(null, false, { message: "Invalid authorization request state." });
    }
    callback(null, true);
  },
};

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./env.js";
import {
  findUserByEmail,
  findUserById,
  createUser,
  usernameExists,
} from "../models/userModel.js";

// "María José" -> "Maria_Jose", then "Maria_Jose_2"... until it's free,
// because usernames are UNIQUE and display names are not.
const uniqueUsernameFrom = async (displayName, email) => {
  const base =
    (displayName || email.split("@")[0])
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 25) || "user";

  let candidate = base.length >= 3 ? base : `${base}_user`;
  for (let n = 2; await usernameExists(candidate); n++) {
    candidate = `${base}_${n}`;
  }
  return candidate;
};

if (config.googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        ...config.google,
        // OAuth "state" parameter protects the callback against CSRF.
        state: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleEmail = profile.emails?.[0];
          if (!googleEmail?.value || googleEmail.verified === false) {
            return done(null, false, { message: "Google email not verified" });
          }

          const email = googleEmail.value.toLowerCase();
          let user = await findUserByEmail(email);

          if (!user) {
            const username = await uniqueUsernameFrom(
              profile.displayName,
              email,
            );
            const userId = await createUser(username, email);
            user = await findUserById(userId);
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}

export default passport;

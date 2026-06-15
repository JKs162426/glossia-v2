import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findUserByEmail, createUser } from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile:", profile.emails[0].value);

        const email = profile.emails[0].value;
        let user = await findUserByEmail(email);

        if (!user) {
          const userId = await createUser(
            profile.displayName.replace(/\s+/g, "_"),
            email,
            "google_oauth"
          );
          user = { id: userId, username: profile.displayName, email };
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;

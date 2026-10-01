import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Fail fast: the API must never start with missing secrets (e.g. an
// undefined JWT_SECRET would make every token trivially forgeable).
const required = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
  "SESSION_SECRET",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const isProd = process.env.NODE_ENV === "production";

if (isProd && process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters in production");
  process.exit(1);
}

const config = {
  isProd,
  port: Number(process.env.PORT) || 3000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  sessionSecret: process.env.SESSION_SECRET,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/google/callback",
  },
};

config.googleEnabled = Boolean(
  config.google.clientID && config.google.clientSecret,
);

export default config;

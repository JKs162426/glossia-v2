import config from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import favoritesRoutes from "./routes/favoritesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import learnRoutes from "./routes/learnRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
if (config.isProd) app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// The session only lives during the Google OAuth handshake (to store the
// anti-CSRF "state"); the app itself authenticates with the JWT cookie.
app.use(
  session({
    name: "glossia_oauth",
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.isProd,
      maxAge: 10 * 60 * 1000,
    },
  }),
);
app.use(passport.initialize());

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/learn", learnRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Glossia API running 🚀" });
});

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;

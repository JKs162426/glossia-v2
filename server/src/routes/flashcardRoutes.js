import express from "express";
import { createSession } from "../controllers/flashcardController.js";
import authMiddleware from "../middleware/auth.js";
import { flashcardSessionValidators } from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/sessions", flashcardSessionValidators, validate, createSession);

export default router;

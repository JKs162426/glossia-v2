import express from "express";
import { getOverview } from "../controllers/statsController.js";
import authMiddleware from "../middleware/auth.js";
import { languageQueryValidator } from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/overview", languageQueryValidator, validate, getOverview);

export default router;

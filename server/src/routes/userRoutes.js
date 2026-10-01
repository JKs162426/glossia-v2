import express from "express";
import { setLanguage } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import { languageBodyValidator } from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(authMiddleware);

router.put("/language", languageBodyValidator, validate, setLanguage);

export default router;

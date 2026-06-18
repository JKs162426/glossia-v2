import express from "express";
import { getMe, setLanguage } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMe);
router.put("/language", setLanguage);

export default router;

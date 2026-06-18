import express from "express";
import {
  listCategories,
  getCategoryWords,
} from "../controllers/categoryController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listCategories);
router.get("/:id/words", getCategoryWords);

export default router;

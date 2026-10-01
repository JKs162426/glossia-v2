import express from "express";
import {
  listCategories,
  getCategoryDeck,
} from "../controllers/categoryController.js";
import authMiddleware from "../middleware/auth.js";
import {
  idParamValidator,
  languageQueryValidator,
} from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", languageQueryValidator, validate, listCategories);
router.get(
  "/:id/deck",
  idParamValidator,
  languageQueryValidator,
  validate,
  getCategoryDeck,
);

export default router;

import express from "express";
import {
  getFavorites,
  createFavorite,
  removeFavorite,
} from "../controllers/favoritesController.js";
import authMiddleware from "../middleware/auth.js";
import {
  favoriteValidators,
  idParamValidator,
  optionalLanguageQueryValidator,
} from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  optionalLanguageQueryValidator,
  validate,
  getFavorites,
);
router.post("/", favoriteValidators, validate, createFavorite);
router.delete("/:id", idParamValidator, validate, removeFavorite);

export default router;

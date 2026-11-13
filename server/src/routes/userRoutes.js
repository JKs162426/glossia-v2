import express from "express";
import { setLanguage, deleteAccount } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import {
  languageBodyValidator,
  deleteAccountValidators,
} from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";
import { deleteAccountLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.use(authMiddleware);

router.put("/language", languageBodyValidator, validate, setLanguage);
router.delete(
  "/me",
  deleteAccountLimiter,
  deleteAccountValidators,
  validate,
  deleteAccount,
);

export default router;

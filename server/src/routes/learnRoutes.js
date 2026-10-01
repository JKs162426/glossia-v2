import express from "express";
import {
  getPath,
  getLesson,
  completeLesson,
} from "../controllers/learnController.js";
import authMiddleware from "../middleware/auth.js";
import {
  languageQueryValidator,
  lessonParamValidators,
  lessonCompleteValidators,
} from "../middleware/validators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/path", languageQueryValidator, validate, getPath);
router.get("/lessons/:lessonId", lessonParamValidators, validate, getLesson);
router.post(
  "/lessons/:lessonId/complete",
  lessonCompleteValidators,
  validate,
  completeLesson,
);

export default router;

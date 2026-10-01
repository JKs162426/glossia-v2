import { body, param, query } from "express-validator";
import { LANGUAGE_CODES } from "../config/languages.js";

const email = () =>
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .isLength({ max: 100 })
    .withMessage("Email is too long")
    .toLowerCase();

const languageIn = (field) =>
  field.isIn(LANGUAGE_CODES).withMessage("Unsupported language");

export const registerValidators = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),
  email(),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    // bcrypt silently ignores everything after 72 bytes
    .isLength({ max: 72 })
    .withMessage("Password must be at most 72 characters")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

export const loginValidators = [
  email(),
  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ max: 72 })
    .withMessage("Invalid credentials"),
];

export const languageBodyValidator = [languageIn(body("language"))];

export const languageQueryValidator = [languageIn(query("language"))];

export const optionalLanguageQueryValidator = [
  languageIn(query("language").optional()),
];

export const idParamValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid id").toInt(),
];

export const favoriteValidators = [
  body("word")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Word is required")
    .isLength({ max: 255 })
    .withMessage("Word must be under 255 characters"),
  body("translation")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Translation is required")
    .isLength({ max: 255 })
    .withMessage("Translation must be under 255 characters"),
  languageIn(body("language")),
];

export const flashcardSessionValidators = [
  languageIn(body("language")),
  body("categoryId").optional({ values: "null" }).isInt({ min: 1 }).toInt(),
  body("results")
    .isArray({ min: 1, max: 200 })
    .withMessage("Results must be a non-empty list"),
  body("results.*.word").isString().trim().notEmpty().isLength({ max: 255 }),
  body("results.*.correct").isBoolean().toBoolean(),
];

export const lessonParamValidators = [
  param("lessonId")
    .matches(/^a[12]-u\d+-(l\d+|test)$/)
    .withMessage("Invalid lesson id"),
  languageIn(query("language")),
];

export const lessonCompleteValidators = [
  param("lessonId")
    .matches(/^a[12]-u\d+-(l\d+|test)$/)
    .withMessage("Invalid lesson id"),
  languageIn(body("language")),
  body("correct").isInt({ min: 0, max: 100 }).toInt(),
  body("total").isInt({ min: 1, max: 100 }).toInt(),
  body().custom(({ correct, total }) => {
    if (Number(correct) > Number(total)) {
      throw new Error("Correct answers can't exceed the total");
    }
    return true;
  }),
];

import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["node_modules", "test-results", "playwright-report"]),
  {
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // Playwright reads fixture dependencies from the destructured first
      // parameter: a fixture with none must write `async ({}, use)`, and a
      // test asks for `user` only to get a logged-in browser, without using
      // the variable. Renaming it to `_user` would ask for another fixture.
      "no-empty-pattern": ["error", { allowObjectPatternsAsParameters: true }],
      "no-unused-vars": ["error", { args: "none" }],
    },
  },
  {
    // Callbacks passed to page.evaluate() run in the browser.
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);

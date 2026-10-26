import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["node_modules", "coverage"]),
  {
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // Express error handlers must declare 4 params even if `next` is unused;
      // a leading underscore marks an intentionally unused argument.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
]);

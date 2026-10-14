import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

// Flat config (ESLint 9), same style as front_end/eslint.config.js.
export default defineConfig([
  globalIgnores(["dist", "node_modules", "generated"]),
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      // Existing debt (the tsconfig also tolerates implicit any in legacy
      // controllers): reported, but does not fail the build.
      "@typescript-eslint/no-explicit-any": "warn",
      // Express handlers and error middleware must keep their positional
      // (req, res, next) parameters, and many catch blocks ignore the error.
      "@typescript-eslint/no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
    },
  },
]);

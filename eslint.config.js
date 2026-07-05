import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Deferred Phase-E engine stubs: their bodies intentionally throw
  // "Not implemented" and their imports/params are pre-wired for the future
  // implementation, so they read as "unused" today. These contracts are LOCKED
  // (must not be edited), so we relax the unused-binding rule here rather than
  // mutate scaffolding that isn't shipped in the bundle. Remove these overrides
  // as each engine is implemented.
  {
    files: [
      "engines/adaptive-engine/index.ts",
      "engines/exam-engine/index.ts",
      "engines/troubleshooting-engine/index.ts",
      "engines/review-engine/index.ts",
    ],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  }
);

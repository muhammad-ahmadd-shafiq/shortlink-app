import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z]" }],
    },
  },
  { ignores: ["node_modules/", "dist/", "coverage/"] },
];
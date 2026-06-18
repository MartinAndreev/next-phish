import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.cjs"],
    languageOptions: { globals: { ...globals.commonjs, ...globals.node } },
  },
  { files: ["**/*.mjs"], languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
);

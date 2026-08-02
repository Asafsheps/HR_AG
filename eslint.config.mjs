import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// `next lint` previously prompted for an interactive setup because no config
// existed, which hung the CI job. This is the standard Next.js 15 flat config.
//
// "next/typescript" is required, not optional: the codebase already contains
// `eslint-disable @typescript-eslint/no-explicit-any` comments. Without it that
// rule is undefined and ESLint errors on the disable directives themselves.
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      // Archived Gemini prototype — kept for reference, never built.
      "_legacy_prototype/**",
    ],
  },
];

export default eslintConfig;

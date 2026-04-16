import { FlatCompat } from "@eslint/eslintrc";
import prettierConfig from "eslint-config-prettier";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // Next.js core web vitals + TypeScript rules (legacy compat shim)
  ...compat.extends("next/core-web-vitals"),

  // Global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "**/*.generated.ts",
      "src/infrastructure/supabase/database.types.ts"
    ]
  },

  // Project-wide rule overrides
  {
    rules: {
      // Enforce consistent import ordering
      "import/order": "off",

      // Allow console in non-browser server code
      "no-console": ["warn", { allow: ["error", "warn"] }],

      // React import not needed in Next.js (automatic JSX runtime)
      "react/react-in-jsx-scope": "off"
    }
  },

  // Prettier: must come last to disable all formatting rules
  prettierConfig
];

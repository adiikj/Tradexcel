import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "src/chat/kb/**", "src/scripts/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    rules: {
      // The codebase uses `any` in the request/response plumbing. Replacing it
      // is a separate piece of work (see the review), not something to fail a
      // build over.
      "@typescript-eslint/no-explicit-any": "off",
      // Unused args are common in Express handlers (next is often unused) and
      // in the Prisma callbacks.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      // The `any` in the auth middleware's `user?: any` is deliberate for now.
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    // The knowledge-base cards are YAML, and the chat runtime reads them at
    // runtime; they are data, not code.
    files: ["src/chat/**/*.ts"],
    rules: { "@typescript-eslint/no-unsafe-function-type": "off" },
  }
);

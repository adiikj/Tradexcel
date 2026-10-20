import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
  },
  coverage: {
    provider: "v8",
    // The unit tests target the pure-logic layer: the services and the small
    // utils next to them. Controllers and routes are covered by integration
    // tests, not here.
    include: ["src/services/**", "src/utils/**"],
    reporter: ["text", "json-summary"],
    reportsDirectory: "./coverage",
    // A floor, not a goal - it catches a big regression (a service losing its
    // tests) without turning every new file into a CI failure.
    thresholds: {
      statements: 30,
      branches: 25,
      functions: 30,
      lines: 30,
    },
  },
});

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      all: false,
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      exclude: ["**/_cjs/**", "**/_esm/**", "**/_types/**"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    },
    environment: "node",
    testTimeout: 10_000
  }
})

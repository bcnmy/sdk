import { join } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    alias: {
      "~biconomy": join(__dirname, "../packages"),
      "~tests": join(__dirname, ".")
    },
    coverage: {
      all: false,
      provider: "v8",
      reporter: process.env.CI ? ["lcov"] : ["text", "json", "html"],
      exclude: [
        "**/errors/utils.ts",
        "**/_cjs/**",
        "**/_esm/**",
        "**/_types/**",
        "**/*.test.ts",
        "**/test/**"
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    },
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // setupFiles: [join(__dirname, "./setup.ts")],
    // globalSetup: [join(__dirname, "./globalSetup.ts")],
    // hookTimeout: 20_000,
    testTimeout: 20_000
  }
})

import { join } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      all: false,
      provider: "v8",
      reporter: process.env.CI ? ["json-summary"] : ["text", "json", "html"],
      exclude: [
        "**/errors/utils.ts",
        "**/_cjs/**",
        "**/_esm/**",
        "**/_types/**",
        "**/*.test.ts",
        "**/test/**"
      ],
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40
      }
    },
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // setupFiles: [join(__dirname, "./setup.ts")],
    globalSetup: [join(__dirname, "./globalSetup.ts")],
    // hookTimeout: 20_000,
    testTimeout: 20_000
  }
})

// playwright.config.ts
//
// Playwright configuration for pharma-fx-api-test-suite.
// All tests are API-level -- no browser UI automation needed.
// Tests run against two public APIs:
//   Frankfurter FX API -- https://api.frankfurter.app
//   FDA Drug API       -- https://api.fda.gov

import { defineConfig } from "@playwright/test";

export default defineConfig({
  // All test files are under tests/
  testDir: "./tests",

  // Run all tests in parallel for speed
  fullyParallel: true,

  // Fail the build on CI if test.only is accidentally committed
  forbidOnly: !!process.env.CI,

  // Retry once on CI to handle transient network blips
  retries: process.env.CI ? 1 : 0,

  // Workers: 2 on CI to avoid rate limits, 4 locally
  workers: process.env.CI ? 2 : 4,

  // Report formats
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    // Default timeout per action (one API call)
    actionTimeout: 10_000,

    // Extra headers sent with every request
    extraHTTPHeaders: {
      Accept: "application/json",
      "User-Agent": "pharma-fx-api-test-suite/1.0 (github.com/aksingh-ops)",
    },
  },

  // Global timeout per test (entire test including retries)
  timeout: 30_000,
});

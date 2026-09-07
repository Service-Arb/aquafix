import { defineConfig, devices } from "@playwright/test";

// Layer 2 of tmp/site_dev_plans/testing.md: per-section visual regression.
// Ported from site_conductor/frontend/playwright.config.ts.
//
// Run through the flake (`nix run .#test`), which supplies SITE_PORT and the
// nixpkgs-pinned browsers — the pin is what makes a screenshot render
// identically on every machine.
const PORT = process.env.SITE_PORT ?? "59081";

export default defineConfig({
  testDir: "./tests",
  // Baselines beside the spec, one flat directory: tests/__screenshots__/.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "on-failure" }]],

  // A pixel diff above this fraction fails. The allowance absorbs sub-pixel
  // font rasterisation without masking a real layout change.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      stylePath: "./tests/screenshot.css",
    },
  },

  use: {
    baseURL: `http://localhost:${PORT}`,
    deviceScaleFactor: 1,
    colorScheme: "light",
  },

  // The design specifies exactly two breakpoints, so there are exactly two
  // projects. Anything between them is interpolation we have not designed.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
  ],

  webServer: {
    command: `dx serve --package aquafix --port ${PORT}`,
    cwd: "..",
    url: `http://localhost:${PORT}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});

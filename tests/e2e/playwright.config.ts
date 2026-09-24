import { dirname } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { LEADS_DB, POINT_ORIGIN, PORT, POSTHOG_HOST, POSTHOG_KEY } from "./env";

// Run through the flake (`nix run .#test`), which supplies `@playwright/test`
// and the nixpkgs-pinned browsers — the pin is what makes a screenshot render
// identically on every machine of one OS. Baselines are Linux's, where CI
// runs; elsewhere the pixel comparison is skipped rather than failed against
// another OS's font rasteriser. `.github/workflows/visual-baselines.yml`
// produces them — see the README. `AQUAFIX_SNAPSHOTS=1` shoots anyway, to look
// at the shots locally; never commit what that writes on a mac.
const linux = process.platform === "linux";
const snapshots = linux || process.env.AQUAFIX_SNAPSHOTS === "1";

export default defineConfig({
  testDir: ".",
  // Baselines beside the spec, one flat directory: tests/e2e/__screenshots__/.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  ignoreSnapshots: !snapshots,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  outputDir: "../../test-results",
  reporter: process.env.CI
    ? [["github"], ["list"]]
    : [["list"], ["html", { open: "on-failure", outputFolder: "../../playwright-report" }]],

  // A pixel diff above this fraction fails. The allowance absorbs sub-pixel
  // font rasterisation without masking a real layout change.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      // The call bar's own shot overrides this.
      stylePath: "./screenshot-section.css",
    },
  },

  use: {
    baseURL: POINT_ORIGIN,
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "fr-FR",
  },

  // The design specifies exactly two breakpoints, so there are exactly two
  // projects. Anything between them is interpolation we have not designed.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
  ],

  // The artefact that ships, not `next dev`: the standalone server, with the
  // traced files only — a font `/og` needs and the trace missed fails here.
  // `npm run build` first; `nix run .#test` does.
  webServer: {
    command: `rm -rf "${dirname(LEADS_DB)}" && node .next/standalone/server.js`,
    cwd: "../..",
    url: `http://localhost:${PORT}/health`,
    // Never someone else's server: a dev server has no test key and no
    // throwaway database, and would pass or fail for the wrong reasons.
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
      LEADS_DB_PATH: LEADS_DB,
      // The standalone server runs as production, which refuses to boot
      // without knowing whose address the rate limit counts; nothing sits
      // in front of it here.
      TRUSTED_PROXY: "xff:1",
      POSTHOG_KEY,
      POSTHOG_HOST,
    },
  },
});

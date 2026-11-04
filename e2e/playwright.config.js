import { defineConfig } from "@playwright/test";

const PORT = 3300;

// The tests drive the real app like production does: the client is built and
// served by the API (one origin, real cookies), backed by the test database
// from server/.env.test. Nothing here can reach the production database.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  // Same as the integration tests: create glossia_test and apply migrations.
  globalSetup: "./global-setup.js",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The Google Chrome already installed (also on GitHub's runners), so no
    // browser download is needed.
    channel: "chrome",
    // Animations off: steadier tests, and it checks the app works that way.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm --prefix ../client run build && NODE_ENV=test PORT=${PORT} node ../server/src/server.js`,
    url: `http://localhost:${PORT}/api/health`,
    // Always a fresh server: if the port is taken, Playwright stops with an
    // error instead of silently testing whatever app is running there (and
    // the in-memory rate limits start from zero on every run).
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

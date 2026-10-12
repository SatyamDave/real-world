import { defineConfig } from "@playwright/test";

// End-to-end checks against the production build. Run with `pnpm --filter landing e2e`.
// Not part of `make check`: it needs a browser. `channel: "chrome"` uses the Google Chrome
// already installed; to use Playwright's own Chromium instead, delete that line and run
// `pnpm exec playwright install chromium` once.
const PORT = 4311;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}`, channel: "chrome" },
  projects: [
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

import { configDefaults, defineConfig } from "vitest/config";

// Static SPA for Cloudflare Pages. cobe is split into its own chunk and loaded
// after first paint (see src/components/Globe.tsx), so it stays out of the
// critical path. Keep the critical bundle small; see product/landing-page.md.
export default defineConfig({
  // Playwright specs in e2e/ run with `pnpm e2e`, not under Vitest.
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
  build: {
    target: "es2022",
    cssCodeSplit: false,
  },
});

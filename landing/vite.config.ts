import { defineConfig } from "vite";

// Static SPA for Cloudflare Pages. cobe is split into its own chunk and loaded
// after first paint (see src/components/Globe.tsx), so it stays out of the
// critical path. Keep the critical bundle small; see product/landing-page.md.
export default defineConfig({
  build: {
    target: "es2022",
    cssCodeSplit: false,
  },
});

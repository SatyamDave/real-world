/// <reference types="vitest/config" />
import { defineConfig, type Plugin, runnerImport } from "vite";
import { publicOrigin, robotsTxt, sitemapXml } from "./src/seo.ts";

type Check = typeof import("./src/liveCheck");

// Fails the build when the API it will talk to shows a fixture question, or cannot be reached.
// `vite build --mode fixtures` skips it for a local smoke build.
function noFixtureQuestions(): Plugin {
  let apiUrl = "http://localhost:8000";
  return {
    name: "no-fixture-questions",
    configResolved(config) {
      apiUrl = config.env.VITE_API_URL ?? apiUrl;
    },
    async buildStart() {
      // Loaded through Vite because the SDK ships TypeScript that Node cannot strip.
      const { module } = await runnerImport<Check>("./src/liveCheck.ts", { configFile: false });
      const leaks = await module.fixtureLeaksAt(apiUrl);
      if (leaks.length) this.error(`fixture questions at ${apiUrl}:\n${leaks.join("\n")}`);
    },
  };
}

// Absolute URLs need the public origin. A production build without a valid VITE_PUBLIC_ORIGIN fails;
// dev and `--mode fixtures` fall back to localhost. Also writes robots.txt and sitemap.xml.
function seo(): Plugin {
  let origin = "";
  return {
    name: "seo",
    configResolved(config) {
      const production = config.command === "build" && config.mode === "production";
      origin = publicOrigin(config.env.VITE_PUBLIC_ORIGIN, production);
    },
    transformIndexHtml: (html) => html.replaceAll("__ORIGIN__", origin),
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robotsTxt(origin) });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(origin) });
    },
  };
}

export default defineConfig(({ command, mode }) => ({
  plugins: [seo(), ...(command === "build" && mode === "production" ? [noFixtureQuestions()] : [])],
  // Vitest blanks CSS by default; theme.test.ts reads the font rules and share.ts the tokens as text.
  test: { css: { include: [/fonts\.css/, /tokens\.css/] } },
}));

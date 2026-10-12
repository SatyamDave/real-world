import { defineConfig, type Plugin, runnerImport } from "vite";

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

export default defineConfig(({ command, mode }) => ({
  plugins: command === "build" && mode === "production" ? [noFixtureQuestions()] : [],
}));

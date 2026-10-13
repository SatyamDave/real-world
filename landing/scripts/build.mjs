// Builds the site for one environment, taking the public (VITE_*) values from
// landing/.dev.vars so a build can never mix environments by hand.
//   node scripts/build.mjs staging      Amplitude staging key, Turnstile test site key
//   node scripts/build.mjs production   Amplitude prod key, REAL Turnstile site key (required)
// Production build only builds; deploying to production is a person's step (RUNBOOK section 8).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const target = process.argv[2];
if (!["staging", "production"].includes(target)) {
  console.error("usage: node scripts/build.mjs <staging|production>");
  process.exit(1);
}
const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const need = (k) => {
  if (!vars[k]) {
    console.error(`${k} is missing from .dev.vars`);
    process.exit(1);
  }
  return vars[k];
};

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const env = { ...process.env, VITE_ENVIRONMENT: target };

// The Tally form id is per environment (public: it is in the embed URL). Staging may build
// without one (the page then shows the teaser as text); production may not.
const formId = vars[target === "production" ? "TALLY_FORM_ID_PROD" : "TALLY_FORM_ID_STAGING"] ?? "";
if (formId) env.VITE_TALLY_FORM_ID = formId;
else if (target === "production") {
  console.error(
    "TALLY_FORM_ID_PROD is missing from .dev.vars; build the form from tally/FORM_SPEC.md",
  );
  process.exit(1);
} else {
  console.warn("TALLY_FORM_ID_STAGING is not set: this build shows the teaser as text, no form");
}

if (target === "staging") {
  env.VITE_AMPLITUDE_API_KEY = need("AMPLITUDE_API_KEY_STAGING");
  env.VITE_TURNSTILE_SITE_KEY = TURNSTILE_TEST_SITE_KEY;
  env.VITE_PUBLIC_BASE_URL = "https://landing-preview.real-world-landing.pages.dev";
  env.VITE_AMPLITUDE_REPLAY_SAMPLE_RATE = vars.VITE_AMPLITUDE_REPLAY_SAMPLE_RATE ?? "1";
} else {
  const site = need("TURNSTILE_SITE_KEY_PROD");
  if (site === TURNSTILE_TEST_SITE_KEY || /^[123]x0000/.test(site)) {
    console.error("TURNSTILE_SITE_KEY_PROD is a Cloudflare test key; create a real widget first");
    process.exit(1);
  }
  if (need("AMPLITUDE_API_KEY_PROD") === need("AMPLITUDE_API_KEY_STAGING")) {
    console.error("the prod and staging Amplitude keys are the same");
    process.exit(1);
  }
  env.VITE_AMPLITUDE_API_KEY = vars.AMPLITUDE_API_KEY_PROD;
  env.VITE_TURNSTILE_SITE_KEY = site;
  env.VITE_PUBLIC_BASE_URL = "https://tryrealworld.com";
  env.VITE_AMPLITUDE_REPLAY_SAMPLE_RATE = vars.VITE_AMPLITUDE_REPLAY_SAMPLE_RATE_PROD ?? "0.1";
  for (const k of ["VITE_REDDIT_PIXEL_ID", "VITE_X_PIXEL_ID", "VITE_X_LEAD_EVENT_ID"]) {
    if (vars[k]) env[k] = vars[k];
  }
}

for (const cmd of [
  ["tsc", "--noEmit"],
  ["vite", "build"],
  ["node", "scripts/prerender.mjs"],
]) {
  const r = spawnSync("pnpm", ["exec", ...cmd], { stdio: "inherit", env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`built for ${target}`);

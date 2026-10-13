// Sets the Pages PREVIEW (staging) environment variables from .dev.vars, through the
// Cloudflare Pages API with wrangler's own login. Preview only: it never writes the
// production environment (that is scripts/set-prod-secrets.sh, run by a person at go-live).
// Values are never printed. Usage: node scripts/set-staging-env.mjs
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT = "real-world-landing";
const vars = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
for (const k of ["DATABASE_URL_STAGING", "AMPLITUDE_API_KEY_STAGING"]) {
  if (!vars[k]) throw new Error(`${k} is missing from .dev.vars`);
}

const cfgPath = [
  join(homedir(), "Library/Preferences/.wrangler/config/default.toml"),
  join(homedir(), ".config/.wrangler/config/default.toml"),
].find((p) => {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
});
if (!cfgPath) throw new Error("wrangler is not logged in (run wrangler login)");
const token = /oauth_token\s*=\s*"([^"]+)"/.exec(readFileSync(cfgPath, "utf8"))?.[1];
if (!token) throw new Error("no wrangler oauth token found");

const api = async (path, init = {}) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  const j = await r.json();
  if (!j.success) throw new Error(`${path}: ${JSON.stringify(j.errors)}`);
  return j.result;
};

const accounts = await api("/accounts");
const account = accounts[0].id;
const secret = (value) => ({ type: "secret_text", value });
await api(`/accounts/${account}/pages/projects/${PROJECT}`, {
  method: "PATCH",
  body: JSON.stringify({
    deployment_configs: {
      preview: {
        env_vars: {
          DATABASE_URL: secret(vars.DATABASE_URL_STAGING),
          AMPLITUDE_API_KEY: secret(vars.AMPLITUDE_API_KEY_STAGING),
          ENVIRONMENT: { type: "plain_text", value: "staging" },
        },
      },
    },
  }),
});

const after = await api(`/accounts/${account}/pages/projects/${PROJECT}`);
const names = (env) => Object.keys(after.deployment_configs[env].env_vars ?? {}).sort();
console.log("preview variables:", names("preview").join(", "));
console.log("production variables:", names("production").join(", ") || "(none)");

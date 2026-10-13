// Bindings and secrets for the Pages Functions. Values live in .dev.vars locally
// and in `wrangler pages secret` on Cloudflare; none are ever logged.
export interface Env {
  DATABASE_URL: string;
  // The project key for this deployment: the staging key on Pages preview, the prod key on
  // Pages production. Never both on one deployment.
  AMPLITUDE_API_KEY?: string;
  // "development" | "staging" | "production". Every event carries it. Unset means production,
  // so a missing value can never tag production traffic as test.
  ENVIRONMENT?: string;
  TURNSTILE_SECRET_KEY?: string;
  // Tally signs each webhook with this per-environment secret (set in the form's webhook).
  TALLY_SIGNING_SECRET?: string;
  // Salt for the IP hash. Falls back to TURNSTILE_SECRET_KEY so no new secret is needed.
  RATE_LIMIT_SALT?: string;
}

// One SQL call: parameterised text in, rows out.
export type Db = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export interface Deps {
  db: Db;
  fetch: typeof fetch;
  now: () => Date;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

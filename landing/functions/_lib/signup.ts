import { sendEvent } from "./amplitude";
import { normalizeEmail } from "./email";
import { type Deps, type Env, json } from "./env";
import { allow, hashIp, prune } from "./ratelimit";
import { verifyTurnstile } from "./turnstile";

const MAX_BODY = 8 * 1024;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

const clip = (v: unknown, n = 300): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

// POST /api/signup. Order matters: cheap checks first, the lead is saved before
// anything that can fail (analytics), and no IP is stored (only a salted hash).
export async function handleSignup(
  request: Request,
  env: Env,
  deps: Deps,
  waitUntil: (p: Promise<unknown>) => void = () => {},
): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "too_large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const email = normalizeEmail(body.email);
  if (!email) return json({ error: "invalid_email" }, 400);

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const salt = env.RATE_LIMIT_SALT || env.TURNSTILE_SECRET_KEY || "rw-landing";
  const now = deps.now();
  if (!(await allow(deps.db, await hashIp(salt, ip), now))) {
    return json({ error: "rate_limited" }, 429);
  }
  waitUntil(prune(deps.db, now).catch(() => {}));

  if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken, deps.fetch))) {
    return json({ error: "bot_check_failed" }, 400);
  }

  const utm = (body.utm ?? {}) as Record<string, unknown>;
  const deviceId = clip(body.deviceId, 100);
  const variant = clip(body.headlineVariant, 40);
  const inserted = await deps.db(
    `INSERT INTO waitlist_signups
       (email, headline_variant, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        referrer, landing_path, amplitude_device_id, country, consent_text_version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [
      email,
      variant,
      ...UTM_KEYS.map((k) => clip(utm[k], 200)),
      clip(body.referrer, 500),
      clip(body.landingPath, 200),
      deviceId,
      request.headers.get("CF-IPCountry"),
      clip(body.consentVersion, 40),
    ],
  );

  if (inserted.length === 0) {
    const existing = await deps.db("SELECT id FROM waitlist_signups WHERE email = $1", [email]);
    return json({ signup_id: String(existing[0]?.id), duplicate: true });
  }

  const signupId = String(inserted[0].id);
  waitUntil(
    sendEvent(
      env.AMPLITUDE_API_KEY,
      {
        event_type: "waitlist_email_saved",
        insert_id: signupId,
        signup_id: signupId,
        device_id: deviceId,
        headline_variant: variant,
        props: { utm_source: clip(utm.utm_source, 100), utm_content: clip(utm.utm_content, 100) },
      },
      deps.fetch,
      now,
    ),
  );
  return json({ signup_id: signupId, duplicate: false });
}

// Runs against the Neon `dev` branch. Skipped when DATABASE_URL_DEV is unset
// (CI without the secret). Every row it creates is deleted by id afterwards.
import { afterAll, describe, expect, test } from "vitest";
import { connect } from "./db";
import type { Deps, Env } from "./env";
import { hashIp } from "./ratelimit";
import { hmacHex } from "./signature";
import { handleSignup } from "./signup";
import { DATABASE_URL_DEV } from "./testenv";
import { handleTypeform } from "./typeform";

const SECRET = "test-webhook-secret";
const env: Env = {
  DATABASE_URL: DATABASE_URL_DEV ?? "",
  TURNSTILE_SECRET_KEY: "ts-test",
  TYPEFORM_WEBHOOK_SECRET: SECRET,
  AMPLITUDE_API_KEY: "amp-test",
};

const amplitudeCalls: unknown[] = [];
let turnstileOk = true;
const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
  const u = String(url);
  if (u.includes("turnstile")) return Response.json({ success: turnstileOk });
  if (u.includes("amplitude")) amplitudeCalls.push(JSON.parse(String(init?.body)));
  return Response.json({});
}) as unknown as typeof fetch;

const run = String(Date.now());
const startedAt = new Date().toISOString();
let n = 0;
const nextEmail = () => `landing-test+${run}-${n++}@example.invalid`;
let ipN = 0;
const nextIp = () => `192.0.2.${100 + ipN++}`; // TEST-NET-1, never a real visitor

const signupIds: string[] = [];
const eventIds: string[] = [];
const ipHashes: string[] = [];

describe.skipIf(!DATABASE_URL_DEV)("waitlist storage (Neon dev branch)", () => {
  const db = connect(DATABASE_URL_DEV ?? "");
  const deps: Deps = { db, fetch: fakeFetch, now: () => new Date() };

  async function signup(email: string, extra: Record<string, unknown> = {}, ip = nextIp()) {
    ipHashes.push(await hashIp(env.TURNSTILE_SECRET_KEY ?? "", ip));
    const req = new Request("https://x/api/signup", {
      method: "POST",
      headers: { "CF-Connecting-IP": ip, "CF-IPCountry": "US" },
      body: JSON.stringify({
        email,
        turnstileToken: "tok",
        headlineVariant: "receipts",
        utm: { utm_source: "reddit", utm_content: "receipts" },
        consentVersion: "2026-10-12",
        deviceId: "dev-1",
        ...extra,
      }),
    });
    const pending: Promise<unknown>[] = [];
    const res = await handleSignup(req, env, deps, (p) => pending.push(p));
    await Promise.all(pending);
    const body = (await res.json()) as { signup_id?: string; duplicate?: boolean; error?: string };
    if (body.signup_id) signupIds.push(body.signup_id);
    return { res, body };
  }

  async function sendTypeform(payload: unknown, header?: string | null) {
    const raw = JSON.stringify(payload);
    const sig =
      header === undefined
        ? `sha256=${btoa(String.fromCharCode(...Uint8Array.from((await hmacHex(SECRET, raw)).match(/../g) ?? [], (h) => Number.parseInt(h, 16))))}`
        : header;
    const headers: Record<string, string> = {};
    if (sig) headers["Typeform-Signature"] = sig;
    const pending: Promise<unknown>[] = [];
    const res = await handleTypeform(
      new Request("https://x/api/typeform", { method: "POST", headers, body: raw }),
      env,
      deps,
      (p) => pending.push(p),
    );
    await Promise.all(pending);
    return { res, body: (await res.json()) as Record<string, unknown> };
  }

  const eventFor = (signupId: string, eventId: string) => {
    eventIds.push(eventId);
    return {
      event_id: eventId,
      form_response: {
        token: `resp-${eventId}`,
        hidden: { signup_id: signupId, question_id: "fed-2026-10-28" },
        answers: [
          { field: { ref: "role" }, type: "choice", choice: { label: "Researcher or academic" } },
          { field: { ref: "forecast_probability" }, type: "number", number: 35 },
        ],
      },
    };
  };

  afterAll(async () => {
    if (!DATABASE_URL_DEV) return;
    const real = connect(DATABASE_URL_DEV);
    if (signupIds.length)
      await real("DELETE FROM waitlist_signups WHERE id = ANY($1::uuid[])", [signupIds]);
    if (eventIds.length)
      await real("DELETE FROM typeform_events WHERE id = ANY($1::text[])", [eventIds]);
    // Unverified rows are keyed by a body hash, so we cannot list them up front. The dev
    // branch holds only test data; delete the ones this run logged.
    await real("DELETE FROM typeform_events WHERE id LIKE 'unverified:%' AND received_at >= $1", [
      startedAt,
    ]);
    if (ipHashes.length)
      await real("DELETE FROM signup_rate_limit WHERE ip_hash = ANY($1::text[])", [ipHashes]);
  });

  test("signup stores the row, sends one Amplitude event, and stores no IP", async () => {
    amplitudeCalls.length = 0;
    const email = nextEmail();
    const { res, body } = await signup(email);
    expect(res.status).toBe(200);
    expect(body.duplicate).toBe(false);
    const rows = await db("SELECT * FROM waitlist_signups WHERE id = $1", [body.signup_id]);
    expect(rows[0]).toMatchObject({
      email,
      headline_variant: "receipts",
      utm_source: "reddit",
      country: "US",
      amplitude_device_id: "dev-1",
      consent_text_version: "2026-10-12",
    });
    expect(JSON.stringify(rows[0])).not.toContain("192.0.2.");
    expect(amplitudeCalls).toHaveLength(1);
    const ev = (amplitudeCalls[0] as { events: { event_type: string; insert_id: string }[] })
      .events[0];
    expect(ev).toMatchObject({ event_type: "waitlist_email_saved", insert_id: body.signup_id });
  });

  test("duplicate email returns the same signup id and no second event", async () => {
    const email = nextEmail();
    const first = await signup(email);
    amplitudeCalls.length = 0;
    const second = await signup(email.toUpperCase());
    expect(second.body).toMatchObject({ duplicate: true, signup_id: first.body.signup_id });
    expect(amplitudeCalls).toHaveLength(0);
  });

  test("invalid email is rejected before touching the database", async () => {
    const { res, body } = await signup("not-an-email");
    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_email");
  });

  test("failed Turnstile saves nothing", async () => {
    const email = nextEmail();
    turnstileOk = false;
    const { res, body } = await signup(email);
    turnstileOk = true;
    expect(res.status).toBe(400);
    expect(body.error).toBe("bot_check_failed");
    expect(await db("SELECT 1 FROM waitlist_signups WHERE email = $1", [email])).toHaveLength(0);
  });

  test("the sixth attempt from one visitor in a window is rate limited", async () => {
    const ip = nextIp();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await signup(nextEmail(), {}, ip)).res.status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  test("typeform: valid signature updates the signup once and sends one event", async () => {
    const { body: s } = await signup(nextEmail());
    amplitudeCalls.length = 0;
    const evt = eventFor(String(s.signup_id), `evt-${run}-a`);
    const { res, body } = await sendTypeform(evt);
    expect(res.status).toBe(200);
    expect(body.matched).toBe(true);
    const row = (await db("SELECT * FROM waitlist_signups WHERE id = $1", [s.signup_id]))[0];
    expect(row).toMatchObject({
      role: "Researcher or academic",
      forecast_question_id: "fed-2026-10-28",
      typeform_response_id: `resp-evt-${run}-a`,
    });
    expect(Number(row.forecast_probability)).toBe(0.35);
    expect(row.completed_at).not.toBeNull();
    expect(amplitudeCalls).toHaveLength(1);
  });

  test("typeform: a replayed delivery is ignored", async () => {
    const { body: s } = await signup(nextEmail());
    const evt = eventFor(String(s.signup_id), `evt-${run}-b`);
    expect((await sendTypeform(evt)).res.status).toBe(200);
    amplitudeCalls.length = 0;
    const again = await sendTypeform(evt);
    expect(again.body.replay).toBe(true);
    expect(amplitudeCalls).toHaveLength(0);
    const logged = await db("SELECT 1 FROM typeform_events WHERE id = $1", [`evt-${run}-b`]);
    expect(logged).toHaveLength(1);
  });

  test("typeform: invalid and missing signatures are logged, rejected and change nothing", async () => {
    const { body: s } = await signup(nextEmail());
    const evt = eventFor(String(s.signup_id), `evt-${run}-c`);
    eventIds.pop(); // never stored under its own id when unverified
    const bad = await sendTypeform({ ...evt, marker: run }, "sha256=AAAA");
    const missing = await sendTypeform({ ...evt, marker: run }, null);
    expect(bad.res.status).toBe(401);
    expect(missing.res.status).toBe(401);
    const row = (
      await db("SELECT role, completed_at FROM waitlist_signups WHERE id = $1", [s.signup_id])
    )[0];
    expect(row).toMatchObject({ role: null, completed_at: null });
    const logged = await db(
      "SELECT signature_valid, payload FROM typeform_events WHERE id LIKE 'unverified:%' AND received_at >= $1",
      [startedAt],
    );
    expect(logged.length).toBeGreaterThan(0);
    expect(logged.every((r) => r.signature_valid === false)).toBe(true);
    expect(JSON.stringify(logged[0].payload)).not.toContain(String(s.signup_id)); // metadata only
  });

  test("typeform: the first completed answer wins; a later one cannot overwrite it", async () => {
    const { body: s } = await signup(nextEmail());
    const first = eventFor(String(s.signup_id), `evt-${run}-d1`);
    expect((await sendTypeform(first)).body.matched).toBe(true);
    const second = eventFor(String(s.signup_id), `evt-${run}-d2`);
    (second.form_response.answers[1] as { number: number }).number = 99;
    expect((await sendTypeform(second)).body.matched).toBe(false);
    const row = (
      await db("SELECT forecast_probability FROM waitlist_signups WHERE id = $1", [s.signup_id])
    )[0];
    expect(Number(row.forecast_probability)).toBe(0.35);
  });
});

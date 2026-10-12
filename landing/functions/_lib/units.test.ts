import { expect, test } from "vitest";
import { normalizeEmail } from "./email";
import { hashIp, WINDOW_MS, windowStart } from "./ratelimit";
import { hmacHex, verifyTypeformSignature } from "./signature";
import { verifyTurnstile } from "./turnstile";

test("normalizeEmail trims, lowercases and rejects junk", () => {
  expect(normalizeEmail("  Ann@Example.COM ")).toBe("ann@example.com");
  for (const bad of ["", "nope", "a@b", "a b@c.com", 5, null, `${"a".repeat(250)}@x.com`]) {
    expect(normalizeEmail(bad)).toBeNull();
  }
});

async function sign(secret: string, body: string) {
  const hex = await hmacHex(secret, body);
  const bytes = Uint8Array.from(hex.match(/../g) ?? [], (h) => Number.parseInt(h, 16));
  return `sha256=${btoa(String.fromCharCode(...bytes))}`;
}

test("typeform signature: valid, wrong secret, tampered body, missing, malformed", async () => {
  const body = '{"event_id":"e1"}';
  const header = await sign("s3cret", body);
  expect(await verifyTypeformSignature("s3cret", body, header)).toBe(true);
  expect(await verifyTypeformSignature("other", body, header)).toBe(false);
  expect(await verifyTypeformSignature("s3cret", `${body} `, header)).toBe(false);
  expect(await verifyTypeformSignature("s3cret", body, null)).toBe(false);
  expect(await verifyTypeformSignature("s3cret", body, "sha256=!!!")).toBe(false);
  expect(await verifyTypeformSignature("s3cret", body, "md5=abc")).toBe(false);
  expect(await verifyTypeformSignature("", body, header)).toBe(false);
});

test("turnstile fails closed", async () => {
  const ok = (async () => Response.json({ success: true })) as unknown as typeof fetch;
  const no = (async () => Response.json({ success: false })) as unknown as typeof fetch;
  const boom = (async () => {
    throw new Error("net");
  }) as unknown as typeof fetch;
  expect(await verifyTurnstile("k", "tok", ok)).toBe(true);
  expect(await verifyTurnstile("k", "tok", no)).toBe(false);
  expect(await verifyTurnstile("k", "tok", boom)).toBe(false);
  expect(await verifyTurnstile("k", "", ok)).toBe(false);
  expect(await verifyTurnstile(undefined, "tok", ok)).toBe(false);
});

test("rate-limit key hides the IP and windows are 10 minutes", async () => {
  const h = await hashIp("salt", "203.0.113.9");
  expect(h).toMatch(/^[0-9a-f]{64}$/);
  expect(h).not.toContain("203");
  expect(h).not.toBe(await hashIp("other", "203.0.113.9"));
  const t = new Date("2026-10-12T10:07:30Z");
  expect(windowStart(t).toISOString()).toBe("2026-10-12T10:00:00.000Z");
  expect(windowStart(t).getTime() % WINDOW_MS).toBe(0);
});

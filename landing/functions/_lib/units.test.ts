import { expect, test } from "vitest";
import { normalizeEmail } from "./email";
import { hashIp, WINDOW_MS, windowStart } from "./ratelimit";
import { hmacHex, verifyTallySignature } from "./signature";
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
  return btoa(String.fromCharCode(...bytes));
}

test("tally signature: valid, wrong secret, tampered body, missing, malformed", async () => {
  const body = '{"eventId":"e1"}';
  const header = await sign("s3cret", body);
  expect(await verifyTallySignature("s3cret", body, header)).toBe(true);
  expect(await verifyTallySignature("other", body, header)).toBe(false);
  expect(await verifyTallySignature("s3cret", body.replace("e1", "e3"), header)).toBe(false);
  // Whitespace around the same JSON is the same payload, and it re-serializes to what was signed.
  expect(await verifyTallySignature("s3cret", `${body} `, header)).toBe(true);
  expect(await verifyTallySignature("s3cret", '{"eventId":"e2"}', header)).toBe(false);
  expect(await verifyTallySignature("s3cret", body, null)).toBe(false);
  expect(await verifyTallySignature("s3cret", body, "!!!")).toBe(false);
  expect(await verifyTallySignature("", body, header)).toBe(false);
});

test("tally signature: accepts the signature of the raw body and of its re-serialized form", async () => {
  // Pretty-printed on the wire, signed either way: both verify, a changed value does not.
  const wire = '{\n  "eventId": "e1",\n  "n": 1\n}';
  const rawSig = await sign("s3cret", wire);
  const reserializedSig = await sign("s3cret", JSON.stringify(JSON.parse(wire)));
  expect(await verifyTallySignature("s3cret", wire, rawSig)).toBe(true);
  expect(await verifyTallySignature("s3cret", wire, reserializedSig)).toBe(true);
  const tampered = wire.replace('"n": 1', '"n": 2');
  expect(await verifyTallySignature("s3cret", tampered, rawSig)).toBe(false);
  expect(await verifyTallySignature("s3cret", tampered, reserializedSig)).toBe(false);
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

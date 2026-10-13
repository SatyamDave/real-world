const enc = new TextEncoder();

function b64decode(s: string): Uint8Array | null {
  try {
    const bin = atob(s);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

// Tally sends `Tally-Signature: <base64 HMAC-SHA256>` (no prefix). Its docs example computes
// it over JSON.stringify(parsedBody); other write-ups say the raw body. We check the raw
// bytes first and, only if that fails, the re-serialized form of the same JSON, so a
// delivery verifies whichever way Tally signs. Both need the secret, so accepting either
// weakens nothing: a changed body fails both. crypto.subtle.verify compares in constant
// time, so there is no timing side channel.
export async function verifyTallySignature(
  secret: string,
  rawBody: string,
  header: string | null,
): Promise<boolean> {
  if (!secret || !header) return false;
  const sig = b64decode(header.trim());
  if (!sig) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  if (await crypto.subtle.verify("HMAC", key, sig, enc.encode(rawBody))) return true;
  try {
    const reserialized = JSON.stringify(JSON.parse(rawBody));
    if (reserialized === rawBody) return false;
    return crypto.subtle.verify("HMAC", key, sig, enc.encode(reserialized));
  } catch {
    return false;
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacHex(secret: string, input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

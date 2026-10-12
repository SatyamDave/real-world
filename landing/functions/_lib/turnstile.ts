const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Returns true only when Cloudflare confirms the token. A missing secret fails
// closed: a deploy without the key must not accept unchecked signups.
export async function verifyTurnstile(
  secret: string | undefined,
  token: unknown,
  doFetch: typeof fetch,
): Promise<boolean> {
  if (!secret || typeof token !== "string" || token.length === 0) return false;
  try {
    const res = await doFetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

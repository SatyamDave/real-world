import type { Db } from "./env";
import { hmacHex } from "./signature";

export const WINDOW_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

// Fixed 10-minute window. The key is HMAC(salt, ip): the raw IP is never stored.
export async function hashIp(salt: string, ip: string): Promise<string> {
  return hmacHex(salt, `ip:${ip}`);
}

export function windowStart(now: Date): Date {
  return new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS);
}

// Counts this attempt and reports whether it is within the limit.
export async function allow(db: Db, ipHash: string, now: Date): Promise<boolean> {
  const rows = await db(
    `INSERT INTO signup_rate_limit (ip_hash, window_start) VALUES ($1, $2)
     ON CONFLICT (ip_hash, window_start)
     DO UPDATE SET attempts = signup_rate_limit.attempts + 1
     RETURNING attempts`,
    [ipHash, windowStart(now).toISOString()],
  );
  const attempts = Number(rows[0]?.attempts ?? 1);
  return attempts <= MAX_ATTEMPTS;
}

// Housekeeping: drop windows older than a day.
export async function prune(db: Db, now: Date): Promise<void> {
  await db("DELETE FROM signup_rate_limit WHERE window_start < $1", [
    new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
  ]);
}

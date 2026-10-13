import { neon } from "@neondatabase/serverless";
import type { Db } from "./env";

// Neon's HTTP driver: one stateless request per query, which suits Workers.
export function connect(url: string): Db {
  const sql = neon(url);
  return async (text, params = []) => (await sql.query(text, params)) as Record<string, unknown>[];
}

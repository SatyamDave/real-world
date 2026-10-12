import type { DayRecord, ReceiptDay, ReceiptEntry } from "@real-world/sdk";

// The receipt rules of research/decisions/0002-benchmark-and-receipts.md, recomputed with WebCrypto.

export const GENESIS_ROOT = "0".repeat(64);

type Json = string | boolean | null | Json[] | { [key: string]: Json };

export type Entry = ReceiptEntry["entry"];

function canonicalText(value: Json): string {
  if (typeof value === "number") throw new TypeError("canonical JSON takes numbers as strings");
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalText(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const canonical = (value: Json): Uint8Array =>
  new TextEncoder().encode(canonicalText(value));

const hex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

const unhex = (h: string) => Uint8Array.from(h.match(/../g) ?? [], (b) => Number.parseInt(b, 16));

async function sha256(prefix: number | null, ...parts: Uint8Array[]): Promise<Uint8Array> {
  const head = prefix === null ? [] : [Uint8Array.of(prefix)];
  const all = [...head, ...parts];
  const buf = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of all) {
    buf.set(p, at);
    at += p.length;
  }
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
}

export async function leafHash(entry: Entry, salt: string): Promise<string> {
  return hex(await sha256(0x00, canonical({ ...entry, salt } as Json)));
}

export async function merkleRoot(leafHashes: string[]): Promise<string> {
  let level: Uint8Array[] = [...leafHashes].sort().map(unhex);
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i + 1 < level.length; i += 2)
      next.push(await sha256(0x01, level[i], level[i + 1]));
    if (level.length % 2) next.push(level[level.length - 1]);
    level = next;
  }
  return hex(level[0]);
}

export async function recordHash(day: DayRecord): Promise<string> {
  const { date, prev_root, root, leaf_count, protocol_hash, engine_version } = day;
  return hex(
    await sha256(
      null,
      canonical({ date, prev_root, root, leaf_count, protocol_hash, engine_version }),
    ),
  );
}

/** What the verifier reads: outcomes and anchoring are not part of any hash. */
export type ChainDay = Pick<ReceiptDay, "day" | "record_hash"> & {
  entries: Pick<ReceiptEntry, "entry" | "salt" | "leaf_hash">[];
};

/** Problems per date for days given oldest first, back to genesis; an empty list means verified. */
export async function verifyChain(days: ChainDay[]): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  let prev = GENESIS_ROOT;
  for (const { day, entries, record_hash } of days) {
    const problems: string[] = [];
    const leaves: string[] = [];
    for (const r of entries) {
      const h = await leafHash(r.entry, r.salt);
      leaves.push(h);
      if (h !== r.leaf_hash)
        problems.push(
          `entry ${r.entry.question_id ?? ""} ${r.entry.forecaster ?? ""}: leaf hash does not match`,
        );
    }
    if (String(entries.length) !== day.leaf_count)
      problems.push(`${entries.length} entries but the day record says ${day.leaf_count}`);
    if (!entries.length || (await merkleRoot(leaves)) !== day.root)
      problems.push("Merkle root does not match the entries");
    if (day.prev_root !== prev) problems.push("previous root does not match the day before");
    if ((await recordHash(day)) !== record_hash) problems.push("record hash does not match");
    out[day.date] = problems;
    prev = day.root;
  }
  return out;
}

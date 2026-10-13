// Share text built in the browser: a post test's line.
import type { PostTestOut } from "@real-world/sdk";
import { pct } from "./App";

/** One line for a post test: the post, its landing chance, the coverage and the seal if any. */
export function postShareText(out: PostTestOut, post: string, origin: string): string {
  const r = out.result;
  const quoted = post.length > 80 ? `${post.slice(0, 79)}…` : post;
  const countries = new Set(r.audiences.map((s) => s.country)).size;
  const tiers = [...new Set(r.audiences.map((s) => s.coverage_tier))].sort().join(", ");
  const seal = out.seal
    ? `Sealed ${out.seal.sealed_at.slice(0, 10)} · ${out.seal.sha256.slice(0, 12)}`
    : "Not sealed";
  return `"${quoted}" lands with ${pct(r.landing_chance)} of a simulated audience in ${countries} ${countries === 1 ? "country" : "countries"}. AI-simulated, coverage ${tiers}. ${seal} ${origin}/simulate`;
}

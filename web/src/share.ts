// Share text built in the browser: a post test's line.
import type { PostTestOut } from "@real-world/sdk";
import { pct } from "./App";

/** One line for a message test: the message, its intent and the seal if any. */
export function postShareText(out: PostTestOut, post: string, origin: string): string {
  const r = out.result;
  const quoted = post.length > 80 ? `${post.slice(0, 79)}…` : post;
  const seal = out.seal
    ? `Sealed ${out.seal.sealed_at.slice(0, 10)} · ${out.seal.sha256.slice(0, 12)}`
    : "Not sealed";
  return `"${quoted}" would get ${pct(r.intent)} of simulated ideal customers to sign up, try or buy. AI-simulated, simulated from a description, not real customers. ${seal} ${origin}/simulate`;
}

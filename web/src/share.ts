// Share text built in the browser: the Call it week grid from the reveal, and a post test's line.
import type { PostTestOut, Reveal } from "@real-world/sdk";
import { pct, plural } from "./App";

export type WeekDay = Reveal["week"][number];

// The emoji is for copied text; on the page each square is drawn in the palette by its kind.
export const SQUARES = [
  ["🟩", "Close: Brier under 0.10", "close"],
  ["🟨", "At least as good as a constant 50%", "fair"],
  ["🟥", "Worse than a constant 50%", "worse"],
  ["🟦", "Answered, not resolved yet", "open"],
  ["⬜", "No answer that day", "none"],
] as const;

export function square(w: WeekDay): string {
  if (w.probability === null) return "⬜";
  if (w.brier === null) return "🟦";
  return w.brier < 0.1 ? "🟩" : w.brier <= 0.25 ? "🟨" : "🟥";
}

/** The answer itself is left out so the grid does not spoil the day's question. */
export function weekShareText(reveal: Reveal, date: string, origin: string): string {
  return [
    `Real World Call it, week to ${date}`,
    reveal.week.map(square).join(""),
    `${plural(reveal.streak, "day")} answered in a row`,
    `${origin}/receipts#${date}`,
  ].join("\n");
}

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

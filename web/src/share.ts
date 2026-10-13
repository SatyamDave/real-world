// The Call it week grid and its share text, built in the browser from the reveal.
import type { Reveal } from "@real-world/sdk";
import { plural } from "./App";

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

// Share artifacts built in the browser from API data: the week grid, fork text and fork image.
import type { Agent, Job, Reveal, SimulateResult } from "@real-world/sdk";
import { DISCLOSURE, topicLabel } from "./App";

export type WeekDay = Reveal["week"][number];

export const SQUARES = [
  ["🟩", "Close: Brier under 0.10"],
  ["🟨", "At least as good as a constant 50%"],
  ["🟥", "Worse than a constant 50%"],
  ["🟦", "Answered, not resolved yet"],
  ["⬜", "No answer that day"],
] as const;

export function square(w: WeekDay): string {
  if (w.probability === null) return "⬜";
  if (w.brier === null) return "🟦";
  return w.brier < 0.1 ? "🟩" : w.brier <= 0.25 ? "🟨" : "🟥";
}

/** The answer itself is left out so the grid does not spoil the day's question. */
export function weekShareText(reveal: Reveal, date: string, origin: string): string {
  const days = reveal.streak === 1 ? "day" : "days";
  return [
    `Real World daily forecast, week to ${date}`,
    reveal.week.map(square).join(""),
    `${reveal.streak} ${days} answered in a row`,
    `${origin}/receipts#${date}`,
  ].join("\n");
}

const points = (share: number) => Math.round(Math.abs(share) * 100);

/** One sentence of meaning for a fork: the largest median move and how far the runs spread. */
export function forkSentence(r: SimulateResult): string {
  const topics = Object.entries(r.outputs);
  const countries = `${r.coverage.length} ${r.coverage.length === 1 ? "country" : "countries"}`;
  const spread = Math.max(0, ...topics.map(([, o]) => points(o.final.p90 - o.final.p10)));
  const agree = `the ${r.members} runs agree within ${spread} ${spread === 1 ? "pt" : "pts"}`;
  const [topic, o] = topics.reduce((a, b) =>
    Math.abs(b[1].final.p50 - b[1].baseline_share) > Math.abs(a[1].final.p50 - a[1].baseline_share)
      ? b
      : a,
  );
  const move = o.final.p50 - o.baseline_share;
  if (points(move) < 1) return `No topic moved 1 pt or more across ${countries}; ${agree}.`;
  const n = points(move);
  return `${topicLabel(topic)} ${move > 0 ? "rose" : "fell"} ${n} ${n === 1 ? "pt" : "pts"} across ${countries}; ${agree}.`;
}

export function forkShareText(job: Job, link: string): string {
  if (!job.result) return link;
  return [`“${job.request.event.text}”`, forkSentence(job.result), `${DISCLOSURE}.`, link].join(
    "\n",
  );
}

/** Each step's change in the share leaning yes, walking back from today's share; null when the
 * topic has no share. Steps arrive as logit deltas, which are not percentage points. */
export function shareDeltas(a: Agent): (number | null)[] {
  const clamp = (p: number) => Math.min(Math.max(p, 1e-6), 1 - 1e-6);
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  const logit: Record<string, number> = {};
  for (const [t, p] of Object.entries(a.shares)) logit[t] = Math.log(clamp(p) / (1 - clamp(p)));
  const out: (number | null)[] = a.moved.map(() => null);
  for (let i = a.moved.length - 1; i >= 0; i--) {
    const m = a.moved[i];
    const end = logit[m.topic];
    if (end === undefined) continue;
    out[i] = sigmoid(end) - sigmoid(end - m.delta);
    logit[m.topic] = end - m.delta;
  }
  return out;
}

const SEX: Record<string, string> = { f: "woman", m: "man" };
const EDUCATION: Record<string, string> = {
  low: "less schooling",
  mid: "secondary education",
  high: "higher education",
};
const URBAN: Record<string, string> = { "0": "rural", "1": "urban" };

/** Trait codes from the population tables, in words; unknown codes pass through. */
export function traitWords(t: Record<string, string>): string[] {
  return [
    t.sex && (SEX[t.sex] ?? t.sex),
    t.age_band,
    t.education && (EDUCATION[t.education] ?? t.education),
    t.urban && (URBAN[t.urban] ?? t.urban),
  ].filter(Boolean);
}

/** "USA|35-54|high" as "USA · 35-54 · higher education". */
export const segmentLabel = (s: string) =>
  s
    .split("|")
    .map((p, i) => (i === 2 ? (EDUCATION[p] ?? p) : p))
    .join(" · ");

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return line ? [...lines, line] : lines;
}

/** A 1200x630 PNG of the fork card, the Open Graph size. */
export function forkImage(job: Job, link: string): Promise<Blob> {
  const r = job.result;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx || !r) return Promise.reject(new Error("This browser cannot draw the image"));
  const sans = "-apple-system, 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = "#0f1222";
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = "#818cf8";
  ctx.font = `600 26px ${sans}`;
  ctx.fillText("Real World · fork of today's world", 64, 84);
  ctx.fillStyle = "#ecedf3";
  ctx.font = `700 44px ${sans}`;
  let y = 160;
  for (const l of wrap(ctx, `“${job.request.event.text}”`, 1072).slice(0, 3)) {
    ctx.fillText(l, 64, y);
    y += 56;
  }
  ctx.font = `400 28px ${sans}`;
  ctx.fillStyle = "#c7cad8";
  for (const l of wrap(ctx, forkSentence(r), 1072).slice(0, 2)) {
    ctx.fillText(l, 64, y + 8);
    y += 40;
  }
  ctx.font = `500 26px ${sans}`;
  y += 32;
  for (const [topic, o] of Object.entries(r.outputs).slice(0, 3)) {
    ctx.fillStyle = "#ecedf3";
    ctx.fillText(topicLabel(topic), 64, y);
    ctx.fillStyle = "#9095a8";
    const range = `${points(o.baseline_share)}% → ${points(o.final.p50)}%  (runs ${points(o.final.p10)}–${points(o.final.p90)}%)`;
    ctx.fillText(range, 480, y);
    y += 40;
  }
  ctx.fillStyle = "#9095a8";
  ctx.font = `400 22px ${sans}`;
  ctx.fillText(`${DISCLOSURE}.`, 64, 560);
  ctx.fillText(link, 64, 594);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("The image could not be made"))),
      "image/png",
    ),
  );
}

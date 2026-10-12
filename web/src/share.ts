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

// The share image is always the light receipt, whatever the viewer's theme: the light values of
// styles/tokens.css.
const SLIP = {
  paper: "#f2f4f3",
  paper2: "#e7eae8",
  surface: "#ffffff",
  ink: "#15201b",
  muted: "#5c6660",
  clay: "#b23a2e",
  line: "#cdd3cf",
};
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

/** A 1200x630 PNG of the fork card as a receipt, the Open Graph size. */
export async function forkImage(job: Job, link: string): Promise<Blob> {
  const r = job.result;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx || !r) throw new Error("This browser cannot draw the image");
  // Canvas text does not wait for web fonts, so load the ones it uses first.
  await Promise.all(
    [`600 40px ${SANS}`, `400 26px ${SANS}`, `400 24px ${MONO}`, `500 24px ${MONO}`].map((f) =>
      document.fonts?.load(f).catch(() => []),
    ),
  );
  const [x, w, top, bottom] = [56, 1088, 40, 590];
  ctx.fillStyle = SLIP.paper;
  ctx.fillRect(0, 0, 1200, 630);
  // The slip: offset shadow, white body, ink border, torn bottom edge.
  const slip = (dx: number) => {
    ctx.beginPath();
    ctx.moveTo(x + dx, bottom + dx);
    ctx.lineTo(x + dx, top + dx);
    ctx.lineTo(x + w + dx, top + dx);
    ctx.lineTo(x + w + dx, bottom + dx);
    for (let i = x + w; i > x; i -= 14) {
      ctx.lineTo(i - 7 + dx, bottom + 7 + dx);
      ctx.lineTo(i - 14 + dx, bottom + dx);
    }
  };
  slip(6);
  ctx.fillStyle = SLIP.paper2;
  ctx.fill();
  slip(0);
  ctx.fillStyle = SLIP.surface;
  ctx.fill();
  ctx.strokeStyle = SLIP.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, bottom);
  ctx.lineTo(x, top);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w, bottom);
  ctx.stroke();

  const pad = x + 32;
  const inner = w - 64;
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 24px ${SANS}`;
  ctx.fillStyle = SLIP.muted;
  ctx.fillText("Real World · fork of today's world", pad, 92);
  const stamp = "AI-simulated";
  ctx.font = `600 22px ${SANS}`;
  const sw = ctx.measureText(stamp).width + 24;
  ctx.strokeStyle = SLIP.clay;
  ctx.strokeRect(x + w - 32 - sw, 64, sw, 38);
  ctx.fillStyle = SLIP.clay;
  ctx.fillText(stamp, x + w - 32 - sw + 12, 91);
  ctx.strokeStyle = SLIP.line;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(pad, 122);
  ctx.lineTo(x + w - 32, 122);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = SLIP.ink;
  ctx.font = `600 40px ${SANS}`;
  let y = 180;
  for (const l of wrap(ctx, `“${job.request.event.text}”`, inner).slice(0, 2)) {
    ctx.fillText(l, pad, y);
    y += 50;
  }
  ctx.font = `400 26px ${SANS}`;
  for (const l of wrap(ctx, forkSentence(r), inner).slice(0, 2)) {
    ctx.fillText(l, pad, y + 6);
    y += 36;
  }
  y += 36;
  for (const [topic, o] of Object.entries(r.outputs).slice(0, 3)) {
    ctx.fillStyle = SLIP.muted;
    ctx.font = `400 24px ${SANS}`;
    ctx.fillText(topicLabel(topic), pad, y);
    ctx.fillStyle = SLIP.ink;
    ctx.font = `500 24px ${MONO}`;
    const range = `${points(o.baseline_share)}% → ${points(o.final.p50)}%  (runs ${points(o.final.p10)}–${points(o.final.p90)}%)`;
    ctx.fillText(range, pad + 380, y);
    y += 38;
  }
  ctx.fillStyle = SLIP.muted;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText(`${DISCLOSURE}.`, pad, 536);
  ctx.font = `400 20px ${MONO}`;
  ctx.fillText(link, pad, 566);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("The image could not be made"))),
      "image/png",
    ),
  );
}

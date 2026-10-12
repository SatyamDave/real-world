// Share artifacts built in the browser from API data: the week grid, fork text and fork image.
import type { Agent, Job, Reveal, SimulateResult } from "@real-world/sdk";
import { DISCLOSURE, pct, plural, pts, topicLabel } from "./App";
import tokensCss from "./styles/tokens.css?raw";

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
    `Real World daily forecast, week to ${date}`,
    reveal.week.map(square).join(""),
    `${plural(reveal.streak, "day")} answered in a row`,
    `${origin}/receipts#${date}`,
  ].join("\n");
}

const unsigned = (delta: number) => pts(Math.abs(delta)).slice(1);

type Output = SimulateResult["outputs"][string];

/** "52% to 58% (49-61%)": the median move, then the spread across ensemble members. */
export const bandText = (o: Output) =>
  `${pct(o.baseline_share)} to ${pct(o.final.p50)} (${Math.round(o.final.p10 * 100)}-${pct(o.final.p90)})`;

/** One sentence of meaning for a fork: the largest median move and how far the members spread. */
export function forkSentence(r: SimulateResult): string {
  const topics = Object.entries(r.outputs);
  const countries = r.coverage.length === 1 ? "1 country" : `${r.coverage.length} countries`;
  const spread = Math.max(0, ...topics.map(([, o]) => o.final.p90 - o.final.p10));
  const agree = `all ${r.members} members agree within ${unsigned(spread)}`;
  const [topic, o] = topics.reduce((a, b) =>
    Math.abs(b[1].final.p50 - b[1].baseline_share) > Math.abs(a[1].final.p50 - a[1].baseline_share)
      ? b
      : a,
  );
  const move = o.final.p50 - o.baseline_share;
  if (Math.abs(move) < 0.005)
    return `No topic moved ${unsigned(0.005)} or more across ${countries}; ${agree}.`;
  return `${topicLabel(topic)} ${move > 0 ? "rose" : "fell"} ${unsigned(move)} across ${countries}; ${agree}.`;
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

// The share image is always the light receipt, whatever the viewer's theme, so it reads the light
// values straight from styles/tokens.css rather than the computed (possibly dark) ones.
const token = (name: string) => {
  const m = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`token --${name} missing from styles/tokens.css`);
  return m[1].trim();
};
const SLIP = {
  paper: token("paper"),
  surface: token("surface"),
  ink: token("ink"),
  muted: token("muted"),
  accent: token("accent"),
  line: token("line"),
};
const SANS = token("font-sans");
const MONO = token("font-mono");

/** A 1200x630 PNG of the fork card as a receipt, the Open Graph size. */
export async function forkImage(job: Job, link: string): Promise<Blob> {
  const r = job.result;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx || !r) throw new Error("Could not draw the image in this browser.");
  // Canvas text does not wait for web fonts, so load the ones it uses first.
  await Promise.all(
    [
      `600 40px ${SANS}`,
      `600 26px ${SANS}`,
      `400 26px ${SANS}`,
      `400 22px ${SANS}`,
      `500 22px ${MONO}`,
      `400 20px ${MONO}`,
    ].map((f) => document.fonts?.load(f).catch(() => [])),
  );
  const [x, w, top, bottom] = [56, 1088, 40, 590];
  ctx.fillStyle = SLIP.paper;
  ctx.fillRect(0, 0, 1200, 630);
  // The slip: white body, ink border, torn bottom edge.
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
  ctx.font = `600 26px ${SANS}`;
  ctx.fillStyle = SLIP.ink;
  ctx.fillText("Real World", pad, 92);
  const brand = ctx.measureText("Real World").width;
  ctx.fillStyle = SLIP.accent;
  ctx.fillText(".", pad + brand, 92);
  ctx.font = `400 24px ${SANS}`;
  ctx.fillStyle = SLIP.muted;
  ctx.fillText("Fork result", pad + brand + 28, 92);
  const stamp = "AI-simulated";
  ctx.font = `600 22px ${SANS}`;
  const sw = ctx.measureText(stamp).width + 24;
  ctx.strokeStyle = SLIP.muted;
  ctx.strokeRect(x + w - 32 - sw, 64, sw, 38);
  ctx.fillStyle = SLIP.muted;
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
  // Every topic, in two columns, as the card's band list shows them.
  Object.entries(r.outputs)
    .slice(0, 8)
    .forEach(([topic, o], i) => {
      const cx = pad + (i % 2) * (inner / 2);
      const cy = y + Math.floor(i / 2) * 36;
      ctx.fillStyle = SLIP.muted;
      ctx.font = `400 22px ${SANS}`;
      ctx.fillText(topicLabel(topic), cx, cy);
      ctx.fillStyle = SLIP.ink;
      ctx.font = `500 22px ${MONO}`;
      ctx.fillText(bandText(o), cx + 210, cy);
    });
  ctx.fillStyle = SLIP.muted;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText(`${DISCLOSURE}.`, pad, 536);
  ctx.font = `400 20px ${MONO}`;
  ctx.fillText(link, pad, 566);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not make the image."))),
      "image/png",
    ),
  );
}

import { BRAND } from "../brand";

// Message-matched headlines. Each id is also an allowed ad headline in
// gtm/prelaunch-ads.md and derives from a claim in gtm/messaging.md. The page
// reads utm_content to pick one; an unknown or missing value falls back to the
// default. See product/landing-page.md.
export type HeadlineId = "receipts" | "hashed" | "public-score" | "your-call";

export interface Headline {
  id: HeadlineId;
  h1: string;
  sub: string;
}

const B = BRAND.name;

export const HEADLINES: Record<HeadlineId, Headline> = {
  receipts: {
    id: "receipts",
    h1: "Simulations with receipts.",
    sub: `Every morning ${B} simulates how the world's population reacts to the day's news. We hash each forecast before anything resolves, then score it in public — the misses too.`,
  },
  hashed: {
    id: "hashed",
    h1: "Forecasts, hashed before the outcome.",
    sub: `${B} commits each day's forecast as a hash before the event happens, and scores it in public when it resolves. Nothing is backfilled.`,
  },
  "public-score": {
    id: "public-score",
    h1: "We publish our misses.",
    sub: `${B} scores its forecasts against the prediction markets in public, wins and misses alike. Watch the record start.`,
  },
  "your-call": {
    id: "your-call",
    h1: "Make your call before the world does.",
    sub: `Give us your forecast on today's question. When it resolves, we score you against the simulated world and the market price.`,
  },
};

export const DEFAULT_HEADLINE_ID: HeadlineId = "receipts";

export function resolveHeadline(utmContent: string | null | undefined): Headline {
  const key = (utmContent ?? "").trim().toLowerCase();
  if (key && Object.hasOwn(HEADLINES, key)) {
    return HEADLINES[key as HeadlineId];
  }
  return HEADLINES[DEFAULT_HEADLINE_ID];
}

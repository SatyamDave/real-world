// Which part of the page a visitor was in when they acted, from the pointer rather than from
// scroll counts (review on #24). Each section carries data-section (set by useViewed; the
// sticky header and the cookie notice set it by hand). The tracker follows the pointer, so
// when someone presses a call to action in the sticky header we still know which content
// section their cursor was in just before, and for how long. A tap has no cursor trail, so
// the section at the tap and the section at the middle of the viewport are the fallback.
// It runs only after the visitor accepts the cookie notice, and sends nothing itself: the
// snapshot is merged into events by track() in analytics.ts.
const SELECTOR = "[data-section]";
// Page chrome, not content: the section under the cursor at the click is the button's own.
const CHROME = new Set(["header", "cookie"]);

export interface SectionSnapshot {
  /** The section at the middle of the viewport. */
  viewport_section: string | null;
  /** The content section the cursor was last in (not the header or the cookie notice). */
  cursor_section: string | null;
  /** Milliseconds the cursor spent in that section on its last visit. */
  cursor_dwell_ms: number;
}

let started = false;
let current: string | null = null;
let enteredAt = 0;
let lastContent: { name: string; dwell: number } | null = null;
let lastMove = 0;

function sectionAt(x: number, y: number): string | null {
  if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
    return null;
  }
  return document.elementFromPoint(x, y)?.closest(SELECTOR)?.getAttribute("data-section") ?? null;
}

function onPointer(e: PointerEvent, throttle: boolean): void {
  const now = performance.now();
  if (throttle && now - lastMove < 100) return;
  lastMove = now;
  const next = sectionAt(e.clientX, e.clientY);
  if (next === current) return;
  if (current && !CHROME.has(current)) lastContent = { name: current, dwell: now - enteredAt };
  current = next;
  enteredAt = now;
}

const onMove = (e: PointerEvent) => onPointer(e, true);
const onDown = (e: PointerEvent) => onPointer(e, false);

export function startSectionTracker(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
}

export function sectionSnapshot(): SectionSnapshot {
  const now = performance.now();
  let cursor = current;
  let dwell = current ? now - enteredAt : 0;
  if (!cursor || CHROME.has(cursor)) {
    cursor = lastContent?.name ?? null;
    dwell = lastContent?.dwell ?? 0;
  }
  const vh = typeof window === "undefined" ? 0 : window.innerHeight;
  const vw = typeof window === "undefined" ? 0 : window.innerWidth;
  return {
    viewport_section: sectionAt(vw / 2, vh / 2),
    cursor_section: cursor,
    cursor_dwell_ms: Math.round(dwell),
  };
}

/** Test hook: forget everything, and let startSectionTracker attach again. */
export function resetSectionTrackerForTests(): void {
  if (typeof window !== "undefined") {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
  }
  started = false;
  current = null;
  enteredAt = 0;
  lastContent = null;
  lastMove = 0;
}

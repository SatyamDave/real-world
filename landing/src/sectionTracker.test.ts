// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  resetSectionTrackerForTests,
  sectionSnapshot,
  startSectionTracker,
} from "./sectionTracker";

function el(section: string): Element {
  const outer = document.createElement("section");
  outer.setAttribute("data-section", section);
  const inner = document.createElement("button");
  outer.append(inner);
  document.body.append(outer);
  return inner;
}

let at: Element | null = null;
beforeEach(() => {
  resetSectionTrackerForTests();
  document.body.innerHTML = "";
  at = null;
  (document as unknown as { elementFromPoint: () => Element | null }).elementFromPoint = () => at;
  vi.spyOn(performance, "now").mockReturnValue(1000);
});
afterEach(() => vi.restoreAllMocks());

function point(type: "pointermove" | "pointerdown", target: Element | null, now: number) {
  at = target;
  vi.spyOn(performance, "now").mockReturnValue(now);
  window.dispatchEvent(new MouseEvent(type, { clientX: 5, clientY: 5 }));
}

test("a press in the header reports the content section the cursor was in before it", () => {
  startSectionTracker();
  const research = el("research");
  const header = el("header");
  point("pointermove", research, 1000);
  point("pointermove", header, 3500); // 2.5 s in research, then to the sticky header button
  point("pointerdown", header, 3600);
  const snap = sectionSnapshot();
  expect(snap.cursor_section).toBe("research");
  expect(snap.cursor_dwell_ms).toBe(2500);
});

test("the section under the cursor is the answer when it is a content section", () => {
  startSectionTracker();
  const hero = el("hero");
  point("pointerdown", hero, 2000);
  vi.spyOn(performance, "now").mockReturnValue(2600);
  const snap = sectionSnapshot();
  expect(snap.cursor_section).toBe("hero");
  expect(snap.cursor_dwell_ms).toBe(600);
});

test("the viewport section comes from the middle of the screen, with no cursor needed", () => {
  startSectionTracker();
  at = el("collaborate");
  const snap = sectionSnapshot();
  expect(snap.viewport_section).toBe("collaborate");
  expect(snap.cursor_section).toBeNull();
});

test("nothing is tracked before it starts", () => {
  const hero = el("hero");
  point("pointerdown", hero, 2000);
  expect(sectionSnapshot().cursor_section).toBeNull();
});

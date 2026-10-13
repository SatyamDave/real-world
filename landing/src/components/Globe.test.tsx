// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("../analytics", () => ({ track }));

import receiptsData from "../data/receipts.json";
import { Globe, pulseSize } from "./Globe";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
  track.mockClear();
});
afterEach(() => container.remove());

const receipts = receiptsData.receipts;

async function mount(onJoin = vi.fn()) {
  await act(async () =>
    createRoot(container).render(<Globe receipts={receipts} onJoin={onJoin} />),
  );
  await act(() => new Promise((r) => setTimeout(r, 0)));
  return onJoin;
}

test("with no WebGL (jsdom) the poster is shown, nothing is tracked and no controls appear", async () => {
  await mount();
  const poster = container.querySelector<HTMLImageElement>("img.globe-poster");
  expect(poster?.getAttribute("src")).toBe("/globe-poster.svg");
  expect(poster?.getAttribute("alt")).toMatch(/globe/i);
  expect(container.querySelector(".globe-controls")).toBeNull();
  expect(track).not.toHaveBeenCalled();
});

test("on the poster the markers in view are real buttons; the one on the far side is not shown", async () => {
  await mount();
  const buttons = [...container.querySelectorAll<HTMLButtonElement>("button.globe-marker")];
  expect(buttons).toHaveLength(3);
  const shown = buttons.filter((b) => !b.hidden).map((b) => b.getAttribute("aria-label"));
  expect(shown).toEqual([
    "Open the receipt for the US Fed decision",
    "Open the receipt for the ECB decision",
  ]); // Tokyo is on the far side of the poster's view; its receipt is in the strip below
  for (const b of buttons) {
    expect(b.style.left).toMatch(/%$/);
    expect(b.style.top).toMatch(/%$/);
  }
});

test("a marker opens its pending receipt, which ends in Make your call", async () => {
  const onJoin = await mount();
  const fed = container.querySelector<HTMLButtonElement>("button.globe-marker");
  await act(async () => fed?.click());
  const card = container.querySelector("#globe-card");
  expect(card?.textContent).toContain("Federal Reserve");
  expect(card?.textContent).toContain("Pending");
  expect(card?.textContent).toContain("AI-simulated. Not a poll.");
  expect(fed?.getAttribute("aria-expanded")).toBe("true");
  expect(track).toHaveBeenCalledWith("marker_opened", {
    receipt_id: "fed-2026-10-28",
    input: "keyboard",
  });
  const call = [...container.querySelectorAll<HTMLButtonElement>("#globe-card button")].find(
    (b) => b.textContent === "Make your call",
  );
  await act(async () => call?.click());
  expect(onJoin).toHaveBeenCalledWith("globe_card");
  expect(container.querySelector("#globe-card")).toBeNull();
});

test("Close shuts the card and puts focus back on the marker", async () => {
  await mount();
  const fed = container.querySelector<HTMLButtonElement>("button.globe-marker");
  await act(async () => fed?.click());
  const close = [...container.querySelectorAll<HTMLButtonElement>("#globe-card button")].find(
    (b) => b.textContent === "Close",
  );
  await act(async () => close?.click());
  expect(container.querySelector("#globe-card")).toBeNull();
  expect(document.activeElement).toBe(fed);
});

test("the globe is a focusable group with a hint that says how to use it", async () => {
  await mount();
  const group = container.querySelector<HTMLElement>("[role=group]");
  expect(group?.getAttribute("tabindex")).toBe("0");
  const hint = container.querySelector(`#${group?.getAttribute("aria-describedby")}`);
  expect(hint?.textContent).toMatch(/marker/i);
});

test("a marker pulses once in its own window and is at base size otherwise", () => {
  expect(pulseSize(0, 0)).toBe(0.05);
  expect(pulseSize(0, 600 + 800)).toBeGreaterThan(0.1); // peak of the first pulse
  expect(pulseSize(0, 600 + 1600)).toBe(0.05);
  expect(pulseSize(1, 600 + 800)).toBe(0.05); // second marker has not started
  expect(pulseSize(1, 600 + 900 + 800)).toBeGreaterThan(0.1);
  expect(pulseSize(0, 60_000)).toBe(0.05);
});

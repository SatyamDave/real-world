// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("../analytics", () => ({ track }));

import { Globe, pulseSize } from "./Globe";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
  track.mockClear();
});
afterEach(() => container.remove());

test("with no WebGL (jsdom) the poster is shown and the fallback event fires", async () => {
  await act(async () =>
    createRoot(container).render(<Globe markers={[{ lat: 38.9, lng: -77 }]} />),
  );
  await act(() => new Promise((r) => setTimeout(r, 0)));

  const poster = container.querySelector<HTMLImageElement>("img.globe-poster");
  expect(poster).not.toBeNull();
  expect(poster?.getAttribute("src")).toBe("/globe-poster.svg");
  expect(poster?.getAttribute("alt")).toMatch(/globe/i);

  expect(track).toHaveBeenCalledWith("globe_fallback_shown", { reason: "no_webgl" });
});

test("a marker pulses once in its own window and is at base size otherwise", () => {
  expect(pulseSize(0, 0)).toBe(0.05);
  expect(pulseSize(0, 600 + 800)).toBeGreaterThan(0.1); // peak of the first pulse
  expect(pulseSize(0, 600 + 1600)).toBe(0.05);
  expect(pulseSize(1, 600 + 800)).toBe(0.05); // second marker has not started
  expect(pulseSize(1, 600 + 900 + 800)).toBeGreaterThan(0.1);
  expect(pulseSize(0, 60_000)).toBe(0.05);
});

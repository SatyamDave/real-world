// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("../analytics", () => ({ track }));

import { Globe } from "./Globe";

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

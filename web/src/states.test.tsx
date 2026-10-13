// @vitest-environment jsdom

import { ApiError } from "@real-world/sdk";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Empty, LoadError, Loading, Refused } from "./App";
import { applyTheme, storedTheme } from "./theme";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let el: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  el = document.body.appendChild(document.createElement("div"));
});
afterEach(() => {
  vi.useRealTimers();
  el.remove();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

test("a skeleton in the result's shape appears only after 200ms; the status line is always there", async () => {
  await act(async () => createRoot(el).render(<Loading what="scores" shape="rows" />));
  expect(el.querySelector("[role=status]")?.textContent).toBe("Loading scores");
  expect(el.querySelectorAll(".skeleton")).toHaveLength(0);
  await act(async () => void vi.advanceTimersByTime(199));
  expect(el.querySelectorAll(".skeleton")).toHaveLength(0);
  await act(async () => void vi.advanceTimersByTime(1));
  expect(el.querySelectorAll(".state-rows .skeleton")).toHaveLength(5);
});

test("LoadError says what and why, keeps the region size class, and retries", async () => {
  const retry = vi.fn();
  await act(async () =>
    createRoot(el).render(
      <LoadError
        what="scores"
        shape="card"
        error={new ApiError(500, { secret: "x" })}
        retry={retry}
      />,
    ),
  );
  expect(el.textContent).toContain("Could not load scores. The server had an error.");
  expect(el.textContent).not.toContain("secret");
  expect(el.querySelector(".state-card")).not.toBeNull();
  await act(async () => el.querySelector("button")?.click());
  expect(retry).toHaveBeenCalledOnce();
});

test("Empty is one sentence and an optional action; Refused carries the sentence and one link", async () => {
  await act(async () =>
    createRoot(el).render(
      <>
        <Empty action={{ label: "Go", href: "/x" }}>Nothing yet.</Empty>
        <Refused help={{ label: "Rules.", href: "/acceptable-use" }}>Refused.</Refused>
      </>,
    ),
  );
  expect(el.querySelector(".empty")?.textContent).toBe("Nothing yet.Go");
  expect(el.querySelector(".empty a")?.getAttribute("href")).toBe("/x");
  expect(el.querySelector(".callout-refused")?.textContent).toBe("Refused. Rules.");
});

test("a stored theme sets data-theme; a blocked store still applies it", () => {
  applyTheme("dark", true);
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(storedTheme()).toBe("dark");
  applyTheme("system", true);
  expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  expect(storedTheme()).toBe("system");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(() => applyTheme("light", true)).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe("light");
});

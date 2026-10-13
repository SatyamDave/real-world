// @vitest-environment jsdom

import { ApiError, type Research } from "@real-world/sdk";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DISCLOSURE } from "../App";
import { rw } from "../api";
import fixture from "../fixtures/research.json";
import Page from "./research";

const research = fixture as unknown as Research;
let container: HTMLDivElement;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

async function render() {
  await act(async () => createRoot(container).render(<Page />));
  await act(() => new Promise((r) => setTimeout(r, 0)));
}

test("lists every experiment with its hash verdict and run, and every paper", async () => {
  vi.spyOn(rw, "research").mockResolvedValue(research);
  await render();
  expect(container.querySelectorAll("[id^=exp-]")).toHaveLength(research.experiments.length);
  expect(container.querySelectorAll("[id^=paper-]")).toHaveLength(research.papers.length);
  expect(container.querySelectorAll(".stamp.good")).not.toHaveLength(0);
  const withRun = research.experiments.find((e) => e.results.length > 0);
  expect(container.textContent).toContain(withRun?.results[0].command);
  expect(container.textContent).toContain("No run committed yet.");
  expect(container.textContent).toContain("Every pre-registration still matches");
  expect(container.textContent).toContain(DISCLOSURE);
});

test("a pre-registration changed after registering is stamped, never hidden", async () => {
  const changed = structuredClone(research);
  Object.assign(changed.experiments[0], { hash_matches: false, prereg_sha256: "f".repeat(64) });
  vi.spyOn(rw, "research").mockResolvedValue(changed);
  await render();
  expect(container.textContent).toContain("Changed since registered");
  expect(container.textContent).toContain("1 pre-registration changed after registration.");
});

test("nothing registered reads as literal status", async () => {
  vi.spyOn(rw, "research").mockResolvedValue({ ...research, experiments: [], papers: [] });
  await render();
  expect(container.textContent).toBe(
    "No experiment is registered yet. The first one appears here.",
  );
});

test("a failed load shows the error and a retry", async () => {
  const spy = vi.spyOn(rw, "research").mockRejectedValueOnce(new ApiError(500, { detail: "boom" }));
  spy.mockResolvedValue(research);
  await render();
  expect(container.querySelector("[role=alert]")?.textContent).toContain(
    "Could not load the research record.",
  );
  await act(async () => container.querySelector<HTMLButtonElement>("button.link")?.click());
  await act(() => new Promise((r) => setTimeout(r, 0)));
  expect(container.querySelector("h1")?.textContent).toBe("Research");
});

test("while loading it says what it is loading", async () => {
  vi.spyOn(rw, "research").mockReturnValue(new Promise(() => {}));
  await render();
  expect(container.querySelector("[role=status]")?.textContent).toContain(
    "Loading the research record",
  );
});

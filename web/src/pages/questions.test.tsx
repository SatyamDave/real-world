// @vitest-environment jsdom

import { ApiError, type QuestionPage } from "@real-world/sdk";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { rw } from "../api";
import fixture from "../fixtures/question.json";
import Page from "./questions";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

async function render(param: string) {
  await act(async () => createRoot(container).render(<Page param={param} />));
}

test("the question page shows each day's committed forecasts, its receipt and what they read", async () => {
  const load = vi.spyOn(rw, "question").mockResolvedValue(fixture as QuestionPage);
  await render("fx-usa-cpi-rise");
  expect(load).toHaveBeenCalledWith("fx-usa-cpi-rise");
  const text = container.textContent ?? "";
  expect(text).toContain("Resolved no");
  expect(container.querySelector('a[href="/receipts#2026-10-02"]')).not.toBeNull();
  // sim 46% with its p10 to p90, then plain LLM and market, then the three Brier scores
  expect(text).toContain("46% 46% to 47%");
  expect(text).toContain("0.215 · 0.277 · 0.410");
  expect(text).toContain("18-34 · high");
  expect(text).toContain("FIXTURE: Campaign in United States turns to the cost of living");
  expect(text).toContain("AI-simulated");
});

test("an id not on the list says so", async () => {
  vi.spyOn(rw, "question").mockRejectedValue(new ApiError(404, "no question nope"));
  await render("nope");
  expect(container.textContent).toContain("No question nope on the committed list.");
});

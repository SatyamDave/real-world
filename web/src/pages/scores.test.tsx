// @vitest-environment jsdom

import type { Scoreboard } from "@real-world/sdk";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { rw } from "../api";
import fixture from "../fixtures/scoreboard.json";
import Page from "./scores";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const board = fixture as Scoreboard;
let container: HTMLDivElement;

afterEach(() => container.remove());

async function render(b: Scoreboard) {
  vi.spyOn(rw, "scoreboard").mockResolvedValue(b);
  container = document.body.appendChild(document.createElement("div"));
  await act(async () => createRoot(container).render(<Page />));
  await act(() => new Promise((r) => setTimeout(r, 0)));
  return container.textContent ?? "";
}

test("below the claim threshold the page says no claim and every number is raw", async () => {
  const text = await render(board);
  expect(text).toContain(`n = ${board.resolved_questions} of 100`);
  expect(text).toContain("so every number above is raw");
  expect(text).toContain(`none below n = 10`);
  const rows = container.querySelectorAll('[aria-label="Resolved questions"] tbody tr');
  expect(rows.length).toBe(board.resolved.length);
  expect(container.querySelectorAll(".misses li").length).toBe(board.misses.length);
});

test("with nothing resolved the page shows the empty state and no tables", async () => {
  const text = await render({ ...board, resolved_questions: 0, resolved: [], misses: [] });
  expect(text).toContain("No question has resolved yet.");
  expect(container.querySelector("table")).toBeNull();
});

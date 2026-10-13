// @vitest-environment jsdom

import { ApiError, type Cycle, type Replay } from "@real-world/sdk";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DISCLOSURE } from "../App";
import { rw } from "../api";
import cycleFixture from "../fixtures/cycle.json";
import replayFixture from "../fixtures/cycle_replay.json";
import Page from "./cycle";

const cycle = cycleFixture as unknown as Cycle;
const replay = replayFixture as unknown as Replay;
let container: HTMLDivElement;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

async function render(param?: string) {
  await act(async () => createRoot(container).render(<Page param={param} />));
  await act(() => new Promise((r) => setTimeout(r, 0)));
}

test("shows every step with its status, the news, the audit, the record and the replay", async () => {
  vi.spyOn(rw, "cycle").mockResolvedValue(cycle);
  vi.spyOn(rw, "cycle_replay").mockResolvedValue(replay);
  await render();
  const rows = container.querySelectorAll("#cycle-steps ~ .table-wrap tbody tr");
  expect(rows).toHaveLength(cycle.steps.length);
  expect(rows[0].textContent).toContain("ingest");
  expect(rows[0].textContent).toContain("Ran");
  expect(container.querySelectorAll("#cycle-news ~ .table-wrap tbody tr")).toHaveLength(
    cycle.news.by_topic.length,
  );
  expect(container.textContent).toContain("No poll was observed");
  expect(container.textContent).toContain("No country is experimental.");
  expect(container.textContent).toContain("Verify every hash");
  expect(container.textContent).toContain(
    `${replay.forecasts.length} of ${replay.forecasts.length}`,
  );
  expect(
    container.querySelectorAll("#cycle-replay ~ .table-wrap tbody tr .stamp.good"),
  ).toHaveLength(replay.forecasts.length);
  expect(container.textContent).toContain(DISCLOSURE);
  expect(container.textContent).toContain("curl");
  const links = [...container.querySelectorAll<HTMLAnchorElement>(".cycle-dates a")];
  expect(links.map((a) => a.getAttribute("href"))).toEqual(cycle.dates.map((d) => `/cycle/${d}`));
  expect(links.filter((a) => a.ariaCurrent === "page").map((a) => a.textContent)).toEqual([
    cycle.date,
  ]);
});

test("a step that has not run, and a replay that differs, read as such", async () => {
  const partial = structuredClone(cycle);
  Object.assign(partial.steps[1], {
    status: "not_run",
    started_at: null,
    seconds: null,
    detail: null,
  });
  const differs = structuredClone(replay);
  Object.assign(differs.forecasts[0], { replayed: null, diff: null, matches: false });
  differs.missing = [differs.forecasts[0].question_id];
  vi.spyOn(rw, "cycle").mockResolvedValue(partial);
  vi.spyOn(rw, "cycle_replay").mockResolvedValue(differs);
  await render();
  expect(container.textContent).toContain("Not run");
  expect(container.textContent).toContain("Not replayable");
  expect(container.textContent).toContain("lack a stored answer");
});

test("empty days say what is missing instead of a table", async () => {
  const empty = structuredClone(cycle);
  Object.assign(empty, { assimilation: [], audit: [], ledger: null });
  empty.news = { source: null, articles: null, clusters: 0, countries: 0, by_topic: [] };
  vi.spyOn(rw, "cycle").mockResolvedValue(empty);
  vi.spyOn(rw, "cycle_replay").mockRejectedValue(new ApiError(404, { detail: "no committed day" }));
  await render();
  for (const text of [
    "The ingest step has not run for this day.",
    "No world snapshot for this day yet.",
    "Spread audit has not run for this day.",
    "No receipts are hashed for this day yet.",
    "No replay for this day.",
  ])
    expect(container.textContent).toContain(text);
});

test("no cycle at all is literal status, not an error", async () => {
  vi.spyOn(rw, "cycle").mockRejectedValue(new ApiError(404, { detail: "no cycle has run yet" }));
  await render();
  expect(container.textContent).toBe("No cycle has run yet. The first daily cycle creates one.");
});

test("a date with no cycle names the date, and the param is the one requested", async () => {
  const spy = vi.spyOn(rw, "cycle").mockRejectedValue(new ApiError(404, { detail: "no cycle" }));
  await render("2026-01-01");
  expect(spy).toHaveBeenCalledWith("2026-01-01");
  expect(container.textContent).toBe("No cycle ran on 2026-01-01.");
});

test("a failed load shows the error and a retry that loads again", async () => {
  const spy = vi.spyOn(rw, "cycle").mockRejectedValueOnce(new ApiError(500, { detail: "boom" }));
  spy.mockResolvedValue(cycle);
  vi.spyOn(rw, "cycle_replay").mockResolvedValue(replay);
  await render();
  expect(container.querySelector("[role=alert]")?.textContent).toContain(
    "Could not load the cycle.",
  );
  expect(container.textContent).not.toContain("boom");
  await act(async () => container.querySelector<HTMLButtonElement>("button.link")?.click());
  await act(() => new Promise((r) => setTimeout(r, 0)));
  expect(container.querySelector("h1")?.textContent).toBe("The daily cycle");
});

test("while loading it says what it is loading", async () => {
  vi.spyOn(rw, "cycle").mockReturnValue(new Promise(() => {}));
  await render();
  expect(container.querySelector("[role=status]")?.textContent).toContain("Loading the cycle");
});

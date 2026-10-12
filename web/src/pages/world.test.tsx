// @vitest-environment jsdom

import { ApiError, type Population } from "@real-world/sdk";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DISCLOSURE } from "../App";
import { rw } from "../api";
import fixture from "../fixtures/world_population.json";
import Page from "./world";

const population = fixture as Population;
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

const heading = () => container.querySelector(".world-country h2")?.textContent;

test("lists every country, opens the best-covered one, and switches on select", async () => {
  vi.spyOn(rw, "population").mockResolvedValue(population);
  await render();
  const rows = container.querySelectorAll(".world-table tbody tr");
  expect(rows).toHaveLength(population.countries.length);
  const first = [...population.countries].sort(
    (a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name),
  )[0];
  expect(heading()).toBe(first.name);
  expect(container.querySelectorAll(".world-topic")).toHaveLength(first.topics.length);
  const other = population.countries.find((c) => c.iso3 !== first.iso3);
  const button = [...container.querySelectorAll<HTMLButtonElement>(".world-table button")].find(
    (b) => b.textContent === other?.name,
  );
  await act(async () => button?.click());
  expect(heading()).toBe(other?.name);
  expect(button?.getAttribute("aria-pressed")).toBe("true");
  expect(container.textContent).toContain(DISCLOSURE);
  expect(container.textContent).toContain("curl");
});

test("a topic the audit has not reached says so instead of a ratio", async () => {
  const unaudited = structuredClone(population);
  for (const c of unaudited.countries)
    for (const t of c.topics) Object.assign(t, { ratio: null, sim_sd_logit: null, in_band: null });
  vi.spyOn(rw, "population").mockResolvedValue(unaudited);
  await render();
  expect(container.textContent).toContain("Spread audit has not run for this day.");
  expect(container.textContent).toContain("Not audited");
  expect(container.textContent).not.toContain("SD ratio");
});

test("no snapshot reads as literal status, not an error", async () => {
  vi.spyOn(rw, "population").mockRejectedValue(
    new ApiError(404, { detail: "no world snapshot committed yet" }),
  );
  await render();
  expect(container.textContent).toBe("No world snapshot yet. The first daily cycle creates one.");
});

// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test } from "vitest";
import { Bars, Histogram, Scatter, Trajectory } from "./Chart";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let box: HTMLDivElement;
beforeEach(() => {
  box = document.body.appendChild(document.createElement("div"));
});
afterEach(() => box.remove());
const draw = (node: React.ReactNode) => act(async () => createRoot(box).render(node));
const rows = () => box.querySelectorAll("tbody tr").length;

const days = Array.from({ length: 30 }, (_, i) => ({
  x: `d${i}`,
  y: i / 30,
  low: i / 30 - 0.1,
  high: i / 30 + 0.1,
}));

test("a trajectory draws a labelled line and a band, with one table row per point", async () => {
  await draw(<Trajectory title="Share over time" points={days} reference={0.5} />);
  expect(box.querySelector("figcaption")?.textContent).toBe("Share over time");
  expect(box.querySelector("svg")?.getAttribute("role")).toBe("img");
  expect(box.querySelector("svg")?.getAttribute("aria-label")).toContain("30 points");
  expect(box.querySelector("path.chart-band")).not.toBeNull();
  expect(box.querySelector("line.chart-ref")).not.toBeNull();
  expect(rows()).toBe(30);
  expect(box.querySelectorAll("details summary")[0].textContent).toBe("Data table");
});

test("trajectory x labels are evenly spaced and never adjacent", async () => {
  const week = Array.from({ length: 7 }, (_, i) => ({ x: `Day ${i + 1}`, y: i }));
  await draw(<Trajectory title="Week" points={week} />);
  const labels = [...box.querySelectorAll("svg text.chart-tick")]
    .filter((t) => t.textContent?.startsWith("Day"))
    .map((t) => t.textContent);
  expect(labels).toEqual(["Day 1", "Day 3", "Day 5", "Day 7"]);
});

test("a two-point trajectory labels both ends", async () => {
  await draw(
    <Trajectory
      title="Two"
      points={[
        { x: "2026-10-01", y: 1 },
        { x: "2026-10-02", y: 2 },
      ]}
    />,
  );
  const labels = [...box.querySelectorAll("svg text.chart-tick")]
    .map((t) => t.textContent)
    .filter((t) => t?.startsWith("2026"));
  expect(labels).toEqual(["2026-10-01", "2026-10-02"]);
});

test("a trajectory without low and high draws no band", async () => {
  await draw(<Trajectory title="T" points={days.map(({ x, y }) => ({ x, y }))} />);
  expect(box.querySelector("path.chart-band")).toBeNull();
});

test("one point is a sentence and the table, not a chart", async () => {
  await draw(<Trajectory title="T" points={[{ x: "d0", y: 0.4 }]} />);
  expect(box.textContent).toContain("Not enough data to draw");
  expect(box.querySelector("svg")).toBeNull();
  expect(rows()).toBe(1);
});

test("bars, scatter and histogram render their rows", async () => {
  await draw(
    <>
      <Bars
        title="B"
        rows={[
          { label: "a", value: 0.2, low: 0.1, high: 0.3 },
          { label: "b", value: 0.6 },
        ]}
      />
      <Scatter
        title="S"
        xLabel="stated"
        yLabel="resolved"
        diagonal
        points={[
          { x: 0.1, y: 0.2, n: 10 },
          { x: 0.9, y: 0.8, n: 4 },
        ]}
      />
      <Histogram
        title="H"
        bins={[
          { low: 0, high: 1, count: 3 },
          { low: 1, high: 2, count: 5 },
        ]}
      />
    </>,
  );
  expect(box.querySelectorAll("svg").length).toBe(3);
  expect(rows()).toBe(6);
  expect(box.querySelectorAll("rect.chart-bar").length).toBe(4);
  expect(box.querySelectorAll("circle").length).toBe(2);
});

test("empty bars and bins say there is not enough data", async () => {
  await draw(
    <>
      <Bars title="B" rows={[]} />
      <Histogram title="H" bins={[]} />
    </>,
  );
  expect(box.textContent?.match(/Not enough data to draw/g)?.length).toBe(2);
});

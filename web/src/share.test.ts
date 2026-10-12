import type { Agent, Daily, Job } from "@real-world/sdk";
import { expect, test } from "vitest";
import agentFixture from "./fixtures/agent.json";
import dailyFixture from "./fixtures/daily.json";
import jobFixture from "./fixtures/job.json";
import {
  forkSentence,
  forkShareText,
  segmentLabel,
  shareDeltas,
  square,
  traitWords,
  weekShareText,
} from "./share";

const reveal = (dailyFixture as Daily).reveal;
const job = jobFixture as Job;

test("squares follow the Brier bands, with open and missing days distinct", () => {
  expect(square({ date: "d", probability: null, brier: null })).toBe("⬜");
  expect(square({ date: "d", probability: 0.4, brier: null })).toBe("🟦");
  expect(square({ date: "d", probability: 0.9, brier: 0.01 })).toBe("🟩");
  expect(square({ date: "d", probability: 0.5, brier: 0.25 })).toBe("🟨");
  expect(square({ date: "d", probability: 0.9, brier: 0.81 })).toBe("🟥");
});

test("the week share text is the grid, the streak and the day's receipt, without the answer", () => {
  if (!reveal) throw new Error("fixture has a reveal");
  const text = weekShareText(reveal, "2026-10-05", "https://rw.test");
  expect(text.split("\n")).toEqual([
    "Real World daily forecast, week to 2026-10-05",
    "⬜⬜🟩🟥🟩🟦🟦",
    "3 days answered in a row",
    "https://rw.test/receipts#2026-10-05",
  ]);
  expect(text).not.toContain("62");
});

test("the fork sentence names the largest move and the member spread", () => {
  const r = job.result;
  if (!r) throw new Error("fixture has a result");
  expect(forkSentence(r)).toBe(
    "Inflation worry rose 6.0 pts across 3 countries; all 5 members agree within 5.0 pts.",
  );
  const flat = Object.fromEntries(
    Object.entries(r.outputs).map(([t, o]) => [
      t,
      { ...o, final: { p10: o.baseline_share, p50: o.baseline_share, p90: o.baseline_share } },
    ]),
  );
  expect(forkSentence({ ...r, outputs: flat })).toBe(
    "No topic moved 0.5 pts or more across 3 countries; all 5 members agree within 0.0 pts.",
  );
  const text = forkShareText(job, "https://rw.test/fork/job_fixture1");
  expect(text).toContain("“A chip shortage doubles phone prices worldwide”");
  expect(text).toContain("AI-simulated. Not a poll or a prediction of a real person.");
  expect(text.endsWith("https://rw.test/fork/job_fixture1")).toBe(true);
});

test("logit steps become share changes that add up to today's share", () => {
  const a = agentFixture as Agent;
  const [first] = shareDeltas(a);
  expect(first).toBeCloseTo(0.0074, 4);
  const one: Agent = {
    ...a,
    shares: { t: 0.5 },
    moved: [
      { date: "1", topic: "t", delta: -1, cause: "x" },
      { date: "2", topic: "t", delta: 1, cause: "y" },
      { date: "2", topic: "gone", delta: 1, cause: "z" },
    ],
  };
  const d = shareDeltas(one);
  expect(d[1]).toBeCloseTo(0.5 - 1 / (1 + Math.exp(1)), 6);
  expect((d[0] ?? 0) + (d[1] ?? 0)).toBeCloseTo(0, 6);
  expect(d[2]).toBeNull();
});

test("trait and segment codes read as words", () => {
  expect(traitWords({ age_band: "35-54", sex: "f", education: "high", urban: "1" })).toEqual([
    "woman",
    "35-54",
    "higher education",
    "urban",
  ]);
  expect(segmentLabel("BRA|18-34|low")).toBe("BRA · 18-34 · less schooling");
});

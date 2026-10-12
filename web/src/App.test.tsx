// @vitest-environment jsdom

import {
  type Agent,
  type AgentWhy,
  ApiError,
  type Daily,
  type Job,
  type World,
} from "@real-world/sdk";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import vector from "../../data/fixtures/receipts_test_vector.json";
import { AgentPanel } from "./AgentPanel";
import { App, DISCLOSURE } from "./App";
import { rw } from "./api";
import { DailyQuestion } from "./DailyQuestion";
import { ForkCard } from "./ForkCard";
import agentFixture from "./fixtures/agent.json";
import whyFixture from "./fixtures/agent_why.json";
import dailyFixture from "./fixtures/daily.json";
import jobFixture from "./fixtures/job.json";
import worldFixture from "./fixtures/world.json";

const world = worldFixture as World;
const job = jobFixture as Job;
let container: HTMLDivElement;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Every SDK call is stubbed; a test resolves only the ones its view needs.
beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
  for (const m of [
    "world",
    "daily",
    "answer_daily",
    "agent",
    "agent_why",
    "receipts",
    "receipt_day",
    "scores",
  ] as const)
    vi.spyOn(rw, m).mockRejectedValue(new Error("not stubbed"));
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

// WebCrypto digests and chained promises can need more than one tick on a slow runner.
const until = (check: () => void) =>
  vi.waitFor(async () => {
    await flush();
    check();
  });

async function render(node: ReactNode) {
  await act(async () => createRoot(container).render(node));
  await flush();
  return container;
}

const button = (text: string) => {
  const b = [...container.querySelectorAll("button")].find((x) => x.textContent?.includes(text));
  if (!b) throw new Error(`no button "${text}"`);
  return b;
};

test("the reveal shows you, visitors, the simulated world and the market after submit", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily).mockResolvedValue({ ...daily, reveal: null });
  vi.mocked(rw.answer_daily).mockResolvedValue(daily);

  const el = await render(<DailyQuestion tiers={["A", "B", "B"]} />);
  expect(el.textContent).toContain(daily.question.text);
  expect(el.textContent).not.toContain("Simulated world");

  await act(async () => button("Submit 50%").click());
  await until(() => expect(el.textContent).toContain("Simulated world"));

  expect(rw.answer_daily).toHaveBeenCalledWith(daily.question.id, expect.any(String), 0.5);
  const text = el.textContent ?? "";
  for (const s of ["You", "62%", "1,204 self-selected visitors", "Simulated world", "56%"])
    expect(text).toContain(s);
  expect(text).toContain("Market61%");
  expect(text).toContain("3 days answered in a row");
  expect(text).toContain(DISCLOSURE);
});

test("a repeat answer (409) still shows the reveal", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily)
    .mockResolvedValueOnce({ ...daily, reveal: null })
    .mockResolvedValueOnce(daily);
  vi.mocked(rw.answer_daily).mockRejectedValue(new ApiError(409, {}));

  const el = await render(<DailyQuestion tiers={[]} />);
  await act(async () => button("Submit").click());
  await until(() => expect(el.textContent).toContain("Simulated world"));
});

test("the fork card renders a fixture SimulateResult", async () => {
  const el = await render(<ForkCard job={job} />);
  const text = el.textContent ?? "";
  expect(text).toContain("“A chip shortage doubles phone prices worldwide”");
  expect(el.querySelectorAll(".shifts li")).toHaveLength(3);
  expect(text).toContain("USA · 25-34 · tertiary");
  expect(text).toContain("+8.1 pts");
  expect(text).toContain("range across 5 simulated runs, not a confidence interval yet");
  expect(text).toContain("52% → 58%");
  expect(text).toContain("$0.0054");
  expect(text).toContain("Counterfactual: not scored");
  expect(el.querySelector<HTMLInputElement>(".share input")?.value).toBe(
    `${location.origin}/fork/job_fixture1`,
  );
  expect(text).toContain(DISCLOSURE);
  expect(el.querySelectorAll(".disclosure .tier")).toHaveLength(3);
});

test("the agent panel labels the trace and the simulated account", async () => {
  vi.mocked(rw.agent).mockResolvedValue(agentFixture as Agent);
  vi.mocked(rw.agent_why).mockResolvedValue(whyFixture as AgentWhy);

  const el = await render(<AgentPanel country={world.countries[0]} onClose={() => {}} />);
  const headings = [...el.querySelectorAll("h3")].map((h) => h.textContent);
  expect(headings).toEqual(["What moved this agent", "In its own words"]);
  expect(rw.agent).toHaveBeenCalledWith(world.countries[0].sample_agent_id);
  expect(el.textContent).toContain("FIXTURE: Fuel prices rise for a third week");
  expect(el.querySelector(".label-simulated")?.textContent).toBe(
    "Simulated account, not the cause",
  );
  expect(el.querySelector("blockquote")?.textContent).toBe(whyFixture.text);
  expect(el.textContent).toContain(DISCLOSURE);
});

test("the receipts page verifies the served chain and states the reference and claim", async () => {
  vi.mocked(rw.world).mockResolvedValue(world);
  vi.mocked(rw.receipts).mockResolvedValue({
    days: [{ ...vector.day, record_hash: vector.record_hash, anchored: false }],
  });
  vi.mocked(rw.receipt_day).mockResolvedValue({
    ...vector,
    anchored: false,
    entries: vector.entries.map((e) => ({ ...e, outcome: null, brier: null })),
  });
  const skill = {
    n: 2,
    n_pairs: 4,
    mean_diff: -0.01,
    low: -0.05,
    high: 0.03,
    claim: "insufficient_n" as const,
    by_tier: {},
    by_region: {},
  };
  vi.mocked(rw.scores).mockResolvedValue({ market: skill, plain_llm: skill });

  const el = await render(<App path="/receipts" />);
  const text = el.textContent ?? "";
  expect(text).toContain("not yet anchored");
  expect(text).toContain("A constant 50% forecast scores 0.25");
  expect(text).toContain("insufficient_n");
  expect(text).toContain("n = 2 questions");

  await act(async () => button("Verify").click());
  await until(() =>
    expect(el.textContent).toContain("Verified 1 day and 2 receipts back to the first day"),
  );
  expect(el.textContent).toContain(DISCLOSURE);
});

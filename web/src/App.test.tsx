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
import spec from "../../api/openapi.json";
import vector from "../../data/fixtures/receipts_test_vector.json";
import { AgentPanel } from "./AgentPanel";
import { App, DISCLOSURE, Disclosure, whenIdle } from "./App";
import { API_URL, rw } from "./api";
import { DailyQuestion } from "./DailyQuestion";
import { atApi } from "./Docs";
import { Fork, ForkCard, ForkRun } from "./ForkCard";
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
    "get_simulation",
  ] as const)
    vi.spyOn(rw, m).mockRejectedValue(new Error("not stubbed"));
  // The daily fixture closes on Oct 6, 23:59 UTC.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
});

afterEach(() => {
  container.remove();
  vi.useRealTimers();
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
  expect(el.textContent).not.toContain("Simulation");
  expect(el.querySelector(".receipt-cols")?.textContent).toContain("Shown after you answer");

  await act(async () => button("Submit 50%").click());
  await until(() => expect(el.textContent).toContain("Simulation"));
  expect(el.querySelector<HTMLAnchorElement>(".receipt-cols a")?.getAttribute("href")).toBe(
    "/receipts#2026-10-05",
  );

  expect(rw.answer_daily).toHaveBeenCalledWith(daily.question.id, expect.any(String), 0.5);
  const text = el.textContent ?? "";
  for (const s of ["You", "62%", "1,204 other self-selected visitors", "Simulation", "56%"])
    expect(text).toContain(s);
  expect(text).toContain("Market61%");
  expect(text).toContain("3 days answered in a row");
  const squares = [...el.querySelectorAll(".week-grid [data-square]")].map((x) =>
    x.getAttribute("data-square"),
  );
  expect(squares).toEqual(["none", "none", "close", "worse", "close", "open", "open"]);
  expect(el.querySelector(".week-grid")?.textContent).toContain("Oct 2: Worse than a constant 50%");
  expect(text).toContain(DISCLOSURE);
});

test("the visitors line names the first answer and does not pluralise one", async () => {
  const daily = dailyFixture as Daily;
  for (const [mean, count, line] of [
    [null, 0, "you are the first"],
    [0.4, 1, "1 other self-selected visitor"],
  ] as const) {
    vi.mocked(rw.daily).mockResolvedValue({
      ...daily,
      reveal: { ...dailyFixture.reveal, crowd: { mean, count } },
    });
    const el = await render(<DailyQuestion tiers={["A"]} />);
    await until(() => expect(el.textContent).toContain(line));
    expect(el.textContent).not.toContain("visitors");
  }
});

test("a closed question shows when answers closed instead of the slider", async () => {
  vi.setSystemTime(new Date("2026-10-07T00:00:00Z"));
  vi.mocked(rw.daily).mockResolvedValue({ ...(dailyFixture as Daily), reveal: null });
  const el = await render(<DailyQuestion tiers={[]} />);
  expect(el.textContent).toContain("Answers closed");
  expect(el.querySelector("input[type=range]")).toBeNull();
});

test("the daily card is a receipt: a Pending stamp until it resolves, and when and where", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily).mockResolvedValue({ ...daily, reveal: null });
  const el = await render(<DailyQuestion tiers={[]} />);
  expect(el.querySelector(".receipt-top .stamp")?.textContent).toBe("Pending");
  const cols = el.querySelector(".receipt-cols")?.textContent ?? "";
  expect(cols).toContain("Resolves2026-10-07example.org");

  vi.mocked(rw.daily).mockResolvedValue({
    ...daily,
    reveal: { ...dailyFixture.reveal, outcome: 1 },
  });
  const resolved = await render(<DailyQuestion tiers={[]} />);
  const stamp = resolved.querySelector(".receipt-top .stamp");
  expect(stamp?.textContent).toBe("Resolved yes");
  expect(stamp?.classList.contains("good")).toBe(true);
});

test("the globe waits for the load event and an idle moment, and can be cancelled", () => {
  const idle = vi.fn((_cb: () => void) => 7);
  const cancelIdle = vi.fn();
  vi.stubGlobal("requestIdleCallback", idle);
  vi.stubGlobal("cancelIdleCallback", cancelIdle);
  const ready = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
  const run = vi.fn();

  const cancel = whenIdle(run);
  expect(idle).not.toHaveBeenCalled();
  dispatchEvent(new Event("load"));
  expect(idle).toHaveBeenCalledWith(run, { timeout: 2000 });
  cancel();
  expect(cancelIdle).toHaveBeenCalledWith(7);

  ready.mockReturnValue("complete");
  whenIdle(run);
  expect(idle).toHaveBeenCalledTimes(2);
  expect(run).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

test("a failed load says what failed in words and retries", async () => {
  vi.mocked(rw.daily).mockRejectedValueOnce(new ApiError(500, { detail: "boom" }));
  const el = await render(<DailyQuestion tiers={[]} />);
  expect(el.textContent).toContain("Could not load today's question. The server had an error.");
  expect(el.textContent).not.toContain("boom");
  vi.mocked(rw.daily).mockResolvedValue({ ...(dailyFixture as Daily), reveal: null });
  await act(async () => button("Try again").click());
  await until(() => expect(el.textContent).toContain((dailyFixture as Daily).question.text));
});

test("a repeat answer (409) still shows the reveal", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily)
    .mockResolvedValueOnce({ ...daily, reveal: null })
    .mockResolvedValueOnce(daily);
  vi.mocked(rw.answer_daily).mockRejectedValue(new ApiError(409, {}));

  const el = await render(<DailyQuestion tiers={[]} />);
  await act(async () => button("Submit").click());
  await until(() => expect(el.textContent).toContain("Simulation"));
});

test("the fork card renders a fixture SimulateResult", async () => {
  const el = await render(<ForkCard job={job} />);
  const text = el.textContent ?? "";
  expect(text).toContain("“A chip shortage doubles phone prices worldwide”");
  expect(el.querySelectorAll(".shifts li")).toHaveLength(3);
  expect(text).toContain("USA · 25-34 · tertiary");
  expect(text).toContain("+8.1 pts");
  expect(text).toContain("n = 14 agents");
  expect(text).toContain(
    "Inflation worry rose 6.0 pts across 3 countries; all 5 members agree within 5.0 pts.",
  );
  expect(text).toContain("p10-p90 range across 5 ensemble members, not a confidence interval yet");
  expect(text).toContain("52% to 58% (56-61%)");
  expect(el.querySelector(".card.receipt")?.closest(".card.fork")).toBeNull();
  expect(text).toContain("$0.01 (estimated $0.01)");
  expect(text).toContain("Counterfactual: not scored");
  expect(el.querySelector<HTMLInputElement>(".share input")?.value).toBe(
    `${location.origin}/fork/job_fixture1`,
  );
  expect(text).toContain(DISCLOSURE);
  expect(el.querySelectorAll(".disclosure .tier")).toHaveLength(3);
});

test("the fork form shows an acceptable-use refusal inline", async () => {
  const detail = "The event names a private person. Real World simulates groups.";
  vi.spyOn(rw, "estimate").mockResolvedValue({
    estimated_cost_usd: 0.001,
    model_calls: 3,
    segments: 3,
    within_cap: true,
  });
  vi.spyOn(rw, "simulate").mockRejectedValue(new ApiError(422, { code: "private_person", detail }));
  const el = await render(<Fork events={world.prefilled_events} />);
  await act(async () => button(world.prefilled_events[0].text).click());
  await until(() => expect(button("Run fork").disabled).toBe(false));
  await act(async () => button("Run fork").click());
  await until(() => expect(el.textContent).toContain(`${detail} See acceptable use.`));
  expect(el.querySelector(".bad a")?.getAttribute("href")).toBe("/acceptable-use");
});

test("the fork form shows a spend refusal's sentence", async () => {
  const detail = "today's fork budget is spent; try again after 00:00 UTC";
  vi.spyOn(rw, "estimate").mockResolvedValue({
    estimated_cost_usd: 0.001,
    model_calls: 3,
    segments: 3,
    within_cap: true,
  });
  vi.spyOn(rw, "simulate").mockRejectedValue(
    new ApiError(402, { code: "fork_budget_spent", detail, estimate: null }),
  );
  const el = await render(<Fork events={world.prefilled_events} />);
  await act(async () => button(world.prefilled_events[0].text).click());
  await until(() => expect(button("Run fork").disabled).toBe(false));
  await act(async () => button("Run fork").click());
  await until(() => expect(el.textContent).toContain(`${detail}.`));
});

test("a fake-model fork says nothing was spent and labels the estimate", async () => {
  const r = job.result;
  if (!r) throw new Error("fixture has a result");
  const fake = { ...r, provider: "fake", cost: { estimated_usd: 0.0061, actual_usd: 0 } };
  const el = await render(<ForkCard job={{ ...job, result: fake }} />);
  expect(el.textContent).toContain("Fake model, nothing spent (a real run is estimated at $0.01)");
});

test("a fork with no shift past the floor says so", async () => {
  const r = job.result;
  if (!r) throw new Error("fixture has a result");
  const el = await render(<ForkCard job={{ ...job, result: { ...r, top_shifts: [] } }} />);
  expect(el.textContent).toContain("No segment of at least 10 agents moved.");
});

test("a missing fork reads as missing, not as a response body", async () => {
  vi.mocked(rw.get_simulation).mockRejectedValue(new ApiError(404, { detail: "no simulation" }));
  const el = await render(<ForkRun id="job_doesnotexist" />);
  expect(el.textContent).toContain("No page at this address.");
  expect(el.textContent).not.toContain("detail");
});

test("the agent panel labels the trace and the simulated account", async () => {
  vi.mocked(rw.agent).mockResolvedValue(agentFixture as Agent);
  vi.mocked(rw.agent_why).mockResolvedValue(whyFixture as AgentWhy);

  const el = await render(<AgentPanel country={world.countries[0]} onClose={() => {}} />);
  const headings = [...el.querySelectorAll("h3")].map((h) => h.textContent);
  expect(headings).toEqual(["What moved this agent", "What it says"]);
  expect(rw.agent).toHaveBeenCalledWith(world.countries[0].sample_agent_id);
  expect(el.textContent).toContain("FIXTURE: Fuel prices rise for a third week");
  expect(el.querySelector(".traits")?.textContent).toContain("female · 25-34 · tertiary · urban");
  // 0.031 logit at a share of about 61% is under 1 point, never "+3.1 pts".
  expect(el.querySelector(".moves .up")?.textContent).toBe("+0.7 pts");
  expect(el.querySelector(".stamp")?.textContent).toBe(whyFixture.label);
  expect(whyFixture.label).toBe("Simulated account, not the cause");
  expect(el.querySelector("blockquote")?.textContent).toBe(whyFixture.text);
  expect(el.textContent).toContain(DISCLOSURE);
});

test("the agent panel says when the account came from the fake model", async () => {
  vi.mocked(rw.agent).mockResolvedValue(agentFixture as Agent);
  vi.mocked(rw.agent_why).mockResolvedValue({ ...(whyFixture as AgentWhy), provider: "fake" });
  const el = await render(<AgentPanel country={world.countries[0]} onClose={() => {}} />);
  await until(() =>
    expect(el.querySelector(".stamp")?.textContent).toBe(
      "Simulated account, not the cause, fake model, placeholder text",
    ),
  );
});

const QUESTION = {
  text: "Will the central bank cut its rate on Oct 3?",
  resolution_source: "https://example.com/fixture/cut",
  resolves_by: "2026-10-03",
};

test("the receipts page verifies the served chain and states the reference and claim", async () => {
  vi.mocked(rw.world).mockResolvedValue(world);
  vi.mocked(rw.receipts).mockResolvedValue({
    days: [
      { ...vector.day, record_hash: vector.record_hash, anchor: "not_anchored", anchored_at: null },
    ],
  });
  vi.mocked(rw.receipt_day).mockResolvedValue({
    ...vector,
    anchor: "not_anchored",
    anchored_at: null,
    anchors: [],
    entries: vector.entries.map((e, i) => ({
      ...e,
      question: i ? null : QUESTION,
      outcome: null,
      brier: null,
    })),
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
  expect(text).toContain(QUESTION.text);
  expect(text).toContain("1 day before resolution");
  expect(text).toContain("Not yet anchored");
  expect(el.querySelector("tbody td:last-child .pending")?.textContent).toBe("Pending");
  const wrap = el.querySelector(".table-wrap");
  expect(wrap?.getAttribute("tabindex")).toBe("0");
  expect(wrap?.getAttribute("aria-label")).toMatch(/\d{4}-\d\d-\d\d/);
  const labels = [...(el.querySelector("tbody tr")?.querySelectorAll("td") ?? [])].map((td) =>
    td.getAttribute("data-label"),
  );
  expect(labels).toEqual([
    null,
    "Forecaster",
    "Probability",
    "Market at commit",
    "Committed",
    "Leaf hash",
    "Outcome",
  ]);
  expect(text).toContain("A constant 50% forecast scores 0.25");
  expect(text).toContain("No claim yet");
  expect(text).toContain("n = 2 resolved questions");
  expect(text).not.toContain("insufficient_n");
  expect(text).not.toContain("95% interval");

  await act(async () => button("Verify").click());
  await until(() =>
    expect(el.textContent).toContain("Verified 1 day and 2 receipts back to the first day"),
  );
  expect(el.textContent).toContain(DISCLOSURE);
});

test.each([
  ["anchored", "Anchored", "2026-10-12 17:19:19 UTCby freetsa.org (RFC 3161 token)", "Z"],
  ["anchored", "Anchored", "2026-10-12 17:19:19 UTCby freetsa.org (RFC 3161 token)", "+00:00"],
  ["pending", "Anchor pending", "OpenTimestamps proof awaits a Bitcoin block", "Z"],
] as const)(
  "a %s day says so on the receipts page (%s, %s, %s)",
  async (anchor, stamp, detail, zone) => {
    const anchored = anchor === "anchored";
    const anchored_at = anchored ? `2026-10-12T17:19:19${zone}` : null;
    vi.mocked(rw.receipts).mockResolvedValue({
      days: [{ ...vector.day, record_hash: vector.record_hash, anchor, anchored_at }],
    });
    vi.mocked(rw.receipt_day).mockResolvedValue({
      ...vector,
      anchor,
      anchored_at,
      anchors: [
        {
          kind: anchored ? "rfc3161" : "opentimestamps",
          service: anchored
            ? "https://freetsa.org/tsr"
            : "https://a.pool.opentimestamps.org/digest",
          requested_at: "2026-10-12T17:19:19Z",
          proof_base64: "AA==",
        },
      ],
      entries: [],
    });
    vi.mocked(rw.scores).mockResolvedValue({});
    const el = await render(<App path="/receipts" />);
    await until(() => expect(el.querySelector(".receipt-top .stamp")?.textContent).toBe(stamp));
    expect(el.querySelector(".receipt-cols div:last-child dd")?.textContent).toBe(detail);
    expect(el.textContent).not.toContain("Not yet anchored");
    // Green marks an anchored day; a pending one keeps the clay stamp.
    expect(el.querySelector(".receipt-top .stamp")?.classList.contains("good")).toBe(anchored);
  },
);

test("the home page states the thesis with the record as proof", async () => {
  vi.mocked(rw.world).mockResolvedValue(world);
  vi.mocked(rw.daily).mockResolvedValue({ ...(dailyFixture as Daily), reveal: null });
  vi.mocked(rw.receipts).mockResolvedValue({
    days: [
      { ...vector.day, record_hash: vector.record_hash, anchor: "not_anchored", anchored_at: null },
    ],
  });
  const el = await render(<App path="/" />);
  await until(() => expect(el.textContent).toContain("Scored in public since"));
  expect(el.querySelector("h1")?.textContent).toBe("Don't ask a model. Ask a world.");
  expect(el.textContent).toContain(
    `Scored in public since Oct 1: 1 day, ${vector.day.leaf_count} receipts.`,
  );
  expect(el.textContent).toContain("World of Oct 5");
  // Without a wide screen the globe is not loaded; the still poster shows and every country is a
  // button instead.
  expect(el.querySelector(".globe-poster")).not.toBeNull();
  expect(el.querySelector(".globe-live")).toBeNull();
  expect(el.querySelectorAll(".countries button")).toHaveLength(world.countries.length);
});

test("an unknown path renders not found, not the home page", async () => {
  const el = await render(<App path="/nothing-here" />);
  expect(el.textContent).toContain("Page not found");
  expect(el.textContent).not.toContain("Don't ask a model");
});

test.each(["/", "/receipts", "/fork/x", "/nothing-here"])("%s has the footer", async (path) => {
  const el = await render(<App path={path} />);
  const links = [...el.querySelectorAll("footer nav a")].map((a) => a.textContent);
  expect(links).toEqual(["Receipts", "Acceptable use", "API", "Source"]);
  expect(el.querySelector("footer a[href='/docs']")?.textContent).toBe("API");
  expect(el.querySelector("footer")?.textContent).toContain(
    "Real World outputs are AI-simulated. Simulated populations are not polls and not predictions about real people.",
  );
  expect(el.querySelector("footer")?.textContent).toContain("© 2026 Real World.");
});

test("the acceptable-use page shows the three rules and the refusal codes", async () => {
  const el = await render(<App path="/acceptable-use" />);
  expect(document.title).toBe("Acceptable use · Real World");
  expect(el.querySelector("h1")?.textContent).toBe("Acceptable use");
  expect([...el.querySelectorAll(".rules strong")].map((s) => s.textContent)).toEqual([
    "No persuasion testing on elections or candidates.",
    "No real private people.",
    "Outputs are labelled simulated.",
  ]);
  expect(el.textContent).toContain("calibrated to published marginals");
  expect(el.textContent).toContain("From 2026-10-27 to 2026-11-04");
  expect([...el.querySelectorAll("tbody tr")].map((r) => r.textContent)).toEqual([
    "private_personNo real private people",
    "election_persuasionNo persuasion testing on elections or candidates",
    "election_windowElection window",
  ]);
});

test("the docs page lists every operation in openapi.json with its refusal codes", async () => {
  const el = await render(<App path="/docs" />);
  await until(() => expect(el.querySelector(".op")).not.toBeNull());
  expect(document.title).toBe("API · Real World");
  const ops = Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.keys(methods).map((m) => `${m.toUpperCase()} ${path}`),
  );
  expect([...el.querySelectorAll(".op")].map((s) => s.getAttribute("aria-label"))).toEqual(ops);
  const simulate = el.querySelector(".op[aria-label='POST /v1/simulate']");
  for (const code of [
    ...spec.components.schemas.Refused.properties.code.enum,
    ...spec.components.schemas.PolicyRefused.properties.code.enum,
  ])
    expect(simulate?.querySelector(".codes")?.textContent).toContain(code);
  expect(simulate?.textContent).toContain(
    spec.components.schemas.SimulateRequest.properties.members.description,
  );
  expect(el.querySelector(".first-call pre")?.textContent).toContain("Idempotency-Key");
  expect(el.textContent).toContain("Authorization: Bearer rw_...");
  const [, py, ts] = [...el.querySelectorAll("pre")].map((p) => p.textContent);
  expect(py).toContain("rw = Client(");
  expect(ts).toContain("const rw = new Client(");
  expect(el.querySelector("header nav a[href='/docs']")?.textContent).toBe("API");
});

test("the docs snippets point at the API this app talks to, not localhost:8000", async () => {
  const base = "https://api.example.com";
  expect(
    atApi('curl -s -X POST localhost:8000/v1/simulate\nnew Client("http://localhost:8000")', base),
  ).toBe(
    'curl -s -X POST https://api.example.com/v1/simulate\nnew Client("https://api.example.com")',
  );
  const el = await render(<App path="/docs" />);
  await until(() => expect(el.querySelector(".op")).not.toBeNull());
  const snippets = [...el.querySelectorAll("pre")].map((p) => p.textContent).join("\n");
  expect(snippets).toContain(`${API_URL}/v1/simulate`);
});

test("the coverage line shows a count for every tier, including one", async () => {
  const el = await render(<Disclosure tiers={["A", "A", "B", "D"]} />);
  const rows = [...el.querySelectorAll(".disclosure-tier")].map((t) => t.textContent);
  expect(rows).toEqual(["Coverage tier A×2", "Coverage tier B×1", "Coverage tier D×1"]);
});

test("an unknown fork sets a not-found title", async () => {
  vi.mocked(rw.get_simulation).mockRejectedValue(new ApiError(404, { detail: "no simulation" }));
  await render(<ForkRun id="job_doesnotexist" />);
  expect(document.title).toBe("Fork not found · Real World");
});

test("a succeeded fork has one h1, its setup sentence", async () => {
  const el = await render(<ForkCard job={job} />);
  const h1 = el.querySelectorAll("h1");
  expect(h1).toHaveLength(1);
  expect(h1[0].textContent).toContain("A chip shortage doubles phone prices worldwide");
});

// @vitest-environment jsdom

import { ApiError, type Daily, type SystemStatus, type World } from "@real-world/sdk";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import vector from "../../data/fixtures/receipts_test_vector.json";
import { App, DISCLOSURE, Disclosure } from "./App";
import { rw } from "./api";
import { DailyQuestion } from "./DailyQuestion";
import dailyFixture from "./fixtures/daily.json";
import statusFixture from "./fixtures/status.json";
import worldFixture from "./fixtures/world.json";
import { PopulationField, SegmentMatrix } from "./results";
import { caseHref, USE_CASES } from "./usecases";

const world = worldFixture as World;
let container: HTMLDivElement;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Every SDK call is stubbed; a test resolves only the ones its view needs.
beforeEach(() => {
  container = document.body.appendChild(document.createElement("div"));
  for (const m of [
    "world",
    "daily",
    "answer_daily",
    "receipts",
    "status",
    "receipt_day",
    "scores",
  ] as const)
    vi.spyOn(rw, m).mockRejectedValue(new Error("not stubbed"));
  // The daily fixture closes on Oct 6, 23:59 UTC.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
});

afterEach(() => {
  vi.unstubAllGlobals();
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

test("the reveal shows you, visitors, the AI and the market after you call it", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily).mockResolvedValue({ ...daily, reveal: null });
  vi.mocked(rw.answer_daily).mockResolvedValue(daily);

  const el = await render(<DailyQuestion tiers={["A", "B", "B"]} />);
  expect(el.textContent).toContain(daily.question.text);
  expect(el.textContent).not.toContain("sealed before you called");
  expect(el.querySelector(".receipt-cols")?.textContent).toContain("Shown after you call");
  expect(el.textContent).not.toContain("Committed");

  // A click where the thumb rests sets the value, though the value does not change.
  await act(async () => (el.querySelector("input[type=range]") as HTMLInputElement).click());
  await act(async () => button("Call it 50%").click());
  await until(() => expect(el.textContent).toContain("sealed before you called"));
  expect(el.querySelector<HTMLAnchorElement>(".receipt-cols a")?.getAttribute("href")).toBe(
    "/receipts#2026-10-05",
  );

  expect(rw.answer_daily).toHaveBeenCalledWith(daily.question.id, expect.any(String), 0.5);
  const text = el.textContent ?? "";
  for (const s of ["You", "62%", "1,204 other self-selected visitors", "AI", "56%"])
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
  expect(el.querySelector(".stamp")?.textContent).toBe("Pending");
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
  await act(async () => typeInto(el.querySelector("input[type=range]") as HTMLInputElement, "40"));
  await act(async () => button("Call it 40%").click());
  await until(() => expect(el.textContent).toContain("sealed before you called"));
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
    await until(() =>
      expect(el.querySelector(".day-record summary .stamp")?.textContent).toBe(stamp),
    );
    expect(el.querySelector(".receipt-cols div:last-child dd")?.textContent).toBe(detail);
    expect(el.textContent).not.toContain("Not yet anchored");
    // Green marks an anchored day; a pending one keeps the clay stamp.
    expect(el.querySelector(".day-record summary .stamp")?.classList.contains("good")).toBe(
      anchored,
    );
  },
);

test("an unknown path renders not found, not the home page", async () => {
  const el = await render(<App path="/nothing-here" />);
  expect(el.textContent).toContain("Page not found");
  expect(el.textContent).not.toContain("Don't ask a model");
});

test.each(["/", "/receipts", "/call", "/nothing-here"])("%s has the footer", async (path) => {
  const el = await render(<App path={path} />);
  const links = [...el.querySelectorAll("footer nav a")].map((a) => a.textContent);
  expect(links).toEqual(["Receipts", "Acceptable use", "Privacy", "Terms", "Source"]);
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

test.each([
  ["/privacy", "Privacy", "rw_session"],
  ["/terms", "Terms", DISCLOSURE],
])("%s renders its page and the footer links it", async (path, name, text) => {
  const el = await render(<App path={path} />);
  await until(() => expect(el.querySelector("article h1")).not.toBeNull());
  expect(el.querySelector("article h1")?.textContent).toBe(name);
  expect(el.querySelector("article")?.textContent).toContain(text);
  expect(el.querySelector(`footer a[href='${path}']`)?.textContent).toBe(name);
  expect(document.title).toBe(`${name} · Real World`);
});

test("the coverage line shows a count for every tier, including one", async () => {
  const el = await render(<Disclosure tiers={["A", "A", "B", "D"]} />);
  const rows = [...el.querySelectorAll(".disclosure-tier")].map((t) => t.textContent);
  expect(rows).toEqual(["Coverage tier A×2", "Coverage tier B×1", "Coverage tier D×1"]);
});

test("the ledger tape is one literal line from GET /v1/status, and the footer has none", async () => {
  vi.mocked(rw.status).mockResolvedValue(statusFixture as SystemStatus);
  const el = await render(<App path="/acceptable-use" />);
  await until(() => expect(el.querySelector(".tape [role=status]")).not.toBeNull());
  expect(el.querySelector("footer")?.textContent).not.toContain("latest receipt");
  expect(el.querySelector(".tape")?.textContent).toBe(
    "Last cycle 2026-10-05 ok · latest receipt b885…6550 · anchor: not anchored · model: fake (nothing spent) · spend today $0.00 of $25.00",
  );
});

test("a status that cannot load says so with a retry", async () => {
  const el = await render(<App path="/acceptable-use" />);
  await until(() => expect(el.querySelector(".tape .load-error")).not.toBeNull());
  expect(el.querySelector(".tape .load-error")?.textContent).toContain(
    "Could not load system status",
  );
});

// session.ts calls fetch for the cookie routes; each test answers the paths it needs.
function serve(routes: Record<string, [number, unknown]>) {
  const calls: { path: string; body?: unknown }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const [status, body] = routes[path] ?? [404, { detail: "not stubbed" }];
      return new Response(body === null ? "" : JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const segment = (label: string, landing: number, tier = "A") => ({
  segment: `USA|18-34|${label}`,
  label,
  country: "USA",
  coverage_tier: tier,
  weight: 0.1,
  landing,
});

const tested = {
  result: {
    landing_chance: 0.42,
    band: [0.3, 0.55],
    mix: { scroll_past: 0.4, read: 0.18, like: 0.3, share: 0.12 },
    best: [segment("young urban", 0.6)],
    worst: [segment("older rural", 0.2, "C")],
    audiences: [segment("young urban", 0.6), segment("older rural", 0.2, "C")],
    voices: [
      { label: "young urban", text: "I would share this.", simulated: "Simulated account" },
      { label: "older rural", text: "Not for me.", simulated: "Simulated account" },
    ],
    rewrite: "Half price for students, this week only.",
    segments: 12,
    model_calls: 15,
    cost_usd: 0.0004,
    provider: "fake",
    calibration: "Uncalibrated until 100 marked tests",
    disclosure: DISCLOSURE,
  },
  seal: null,
};

const typeInto = (el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

test("a post test shows the landing chance, both sides, the accounts and a sign-in line", async () => {
  vi.mocked(rw.world).mockResolvedValue(world);
  const calls = serve({ "/v1/me": [401, { detail: "signed out" }], "/v1/tests": [200, tested] });
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.querySelector("#pg-text")).not.toBeNull());
  expect(button("Test it").disabled).toBe(true);
  await act(async () => typeInto(el.querySelector("#pg-text") as HTMLTextAreaElement, "Half off"));
  await act(async () => (el.querySelector("input[name=gut]") as HTMLInputElement).click());
  await act(async () => button("Test it").click());
  await until(() => expect(el.querySelector(".land-result")).not.toBeNull());
  const sent = calls.find((c) => c.path === "/v1/tests")?.body;
  expect(sent).toEqual({ text: "Half off", gut: "lands", countries: null, age_bands: null });
  const text = el.querySelector(".land-result")?.textContent ?? "";
  for (const s of [
    "42%",
    "30% to 55% across 12 audiences",
    "Uncalibrated until 100 marked tests",
    "Young urban",
    "Older rural",
    "Simulated account, fake model, placeholder text",
    "Half price for students, this week only.",
    "Sign in to seal this test and keep your record.",
    "fake model, nothing spent",
    DISCLOSURE,
  ])
    expect(text).toContain(s);
  expect(el.querySelector(".land-result .stamp")?.textContent).toBe("Not sealed");
});

test("a refused post test shows the API's sentence", async () => {
  serve({
    "/v1/me": [401, {}],
    "/v1/tests": [429, { code: "test_daily_limit", detail: "this address has run 20 tests today" }],
  });
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.querySelector("#pg-text")).not.toBeNull());
  await act(async () => typeInto(el.querySelector("#pg-text") as HTMLTextAreaElement, "x"));
  await act(async () => button("Test it").click());
  await until(() => expect(el.textContent).toContain("this address has run 20 tests today."));
});

test("a signed-in test shows its seal and the retrospective check is labelled", async () => {
  const seal = { id: "pt_1", sha256: "ab".repeat(32), sealed_at: "2026-10-06T12:00:00Z" };
  serve({
    "/v1/me": [200, { id: "usr_1", email: "ada@example.org", created_at: "2026-10-06" }],
    "/v1/tests": [200, { ...tested, seal }],
    "/v1/tests/retrospective": [
      200,
      {
        posts: [{ text: "old post", outcome: "landed", landing_chance: 0.7, hit: true }],
        hits: 1,
        brier: 0.09,
        label: "Retrospective: not on your record",
        disclosure: DISCLOSURE,
      },
    ],
  });
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.textContent).toContain("ada@example.org"));
  await act(async () => typeInto(el.querySelector("#pg-text") as HTMLTextAreaElement, "Half off"));
  await act(async () => button("Test it").click());
  await until(() => expect(el.querySelector(".seal")?.textContent).toContain("abababababab"));
  expect(el.querySelector(".land-result .stamp")?.textContent).toBe("Sealed");
  const cells = [...el.querySelectorAll(".seal-line .seal-grid span")];
  expect(cells).toHaveLength(64);
  expect(cells.every((c) => /^s[0-3]$/.test(c.className))).toBe(true);
  expect(el.querySelector(".seal-hash")?.textContent).toBe("ab".repeat(32));
  expect(el.textContent).toContain("Sealed 2026-10-06 12:00 UTC");

  await act(async () =>
    typeInto(el.querySelector("[aria-label='Past post 1']") as HTMLTextAreaElement, "old post"),
  );
  await act(async () => button("Run the check").click());
  await until(() => expect(el.textContent).toContain("The engine would have called 1 of 1."));
  expect(el.textContent).toContain("Retrospective: not on your record");
});

test("Call it shows the AI's sealed call before the answer and the record after", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily).mockResolvedValue({ ...daily, reveal: null });
  const el = await render(<DailyQuestion tiers={[]} />);
  const ai = el.querySelector(".ai-slip");
  expect(ai?.querySelector(".stamp.good")?.textContent).toBe("Sealed");
  expect(ai?.querySelectorAll(".seal-grid span[class^=s]")).toHaveLength(64);
  expect(ai?.querySelector(".seal-row")?.textContent).toBe(
    "The AI's call is sealed3f9a1c0be27d · day record 2026-10-05",
  );
  expect(ai?.textContent).toContain("Its number is hidden until you call.");
  expect(el.textContent).not.toContain("56%");
  vi.mocked(rw.daily).mockResolvedValue(daily);
  const after = await render(<DailyQuestion tiers={[]} />);
  await until(() =>
    expect(after.textContent).toContain("You 0.181 · AI 0.204 on 4 resolved questions"),
  );
  expect(after.textContent).toContain("you beat the AI on 3");
  expect(after.querySelector(".ai-slip .big")?.textContent).toBe("56%");
});

test("the call button stays disabled until the slider moves", async () => {
  vi.mocked(rw.daily).mockResolvedValue({ ...(dailyFixture as Daily), reveal: null });
  const el = await render(<DailyQuestion tiers={[]} />);
  expect(el.querySelector(".slider-value")?.textContent).toBe("–");
  expect(button("Move the slider to call it").disabled).toBe(true);
  await act(async () => typeInto(el.querySelector("input[type=range]") as HTMLInputElement, "70"));
  expect(button("Call it 70%").disabled).toBe(false);
});

test("a resolved question draws you, the AI and the outcome on one strip", async () => {
  const daily = dailyFixture as Daily;
  vi.mocked(rw.daily).mockResolvedValue({
    ...daily,
    reveal: { ...dailyFixture.reveal, outcome: 1, brier: 0.14 },
  });
  const el = await render(<DailyQuestion tiers={[]} />);
  await until(() => expect(el.querySelector(".outcome-strip")).not.toBeNull());
  const strip = el.querySelector(".outcome-strip");
  expect(strip?.querySelectorAll(".shift-dot, .shift-tick")).toHaveLength(3);
  expect(strip?.querySelector(".outcome-marks")?.textContent).toBe("You 62%AI 56%Outcome Yes");
  expect(strip?.textContent).toContain("Closer: you, by 6.5 pts.");
});

test("the record signed out shows an empty engine-vs-gut slip and no numbers", async () => {
  serve({ "/v1/me": [401, {}] });
  const el = await render(<App path="/record" />);
  await until(() => expect(el.textContent).toContain("Sign in to start your record"));
  const main = el.querySelector("main")?.textContent ?? "";
  for (const s of ["The engine", "Your gut", "– Brier", "0 marked tests"])
    expect(main).toContain(s);
  expect(el.querySelector("main .seal-grid.empty")).not.toBeNull();
  expect(new Set(main.match(/\d+(\.\d+)?/g))).toEqual(new Set(["0", "0.25"]));
});

test("the record lists sealed tests, marks one and checks its seal", async () => {
  const body = '{"id":"pt_1","text":"Half off"}';
  const sha = await crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(body))
    .then((d) => [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""));
  const test1 = {
    seal: { id: "pt_1", sha256: sha, sealed_at: "2026-10-06T12:00:00Z" },
    body,
    text: "Half off",
    gut: "lands",
    landing_chance: 0.42,
    outcome: null,
    marked_at: null,
    brier: null,
    gut_brier: null,
  };
  const calls = serve({
    "/v1/me": [200, { id: "usr_1", email: "ada@example.org", created_at: "2026-10-06" }],
    "/v1/me/tests": [
      200,
      { tests: [test1], marked: 0, hits: 0, brier: null, gut_brier: null, gut_marked: 0 },
    ],
    "/v1/me/tests/pt_1/outcome": [200, { ...test1, outcome: "landed" }],
  });
  const el = await render(<App path="/record" />);
  await until(() => expect(el.textContent).toContain("Half off"));
  expect(el.textContent).toContain("Mark a test Landed or Flopped once you know how it did.");
  expect(el.querySelector("[aria-label='Waiting to be marked'] .record-rows li")).not.toBeNull();
  expect(el.querySelector("[aria-label='Marked']")).toBeNull();
  await act(async () => button("Check seal").click());
  await until(() => expect(el.textContent).toContain("Seal matches"));
  await act(async () => button("Landed").click());
  await until(() => expect(calls.some((c) => c.path === "/v1/me/tests/pt_1/outcome")).toBe(true));
  await act(async () => button("Delete account").click());
  expect(document.activeElement?.textContent).toBe("Cancel");
});

test("sign-in sends the email, then takes the code", async () => {
  const calls = serve({
    "/v1/me": [401, {}],
    "/v1/auth/email": [202, { email: "ada@example.org", ttl_minutes: 15 }],
  });
  const el = await render(<App path="/sign-in" />);
  await until(() => expect(el.querySelector("#email")).not.toBeNull());
  await act(async () =>
    typeInto(el.querySelector("#email") as HTMLInputElement, "ada@example.org"),
  );
  await act(async () => button("Email me a sign-in link").click());
  await until(() =>
    expect(el.textContent).toContain(
      "Check ada@example.org. The link and the code in it work for 15 minutes.",
    ),
  );
  expect(calls.find((c) => c.path === "/v1/auth/email")?.body).toEqual({
    email: "ada@example.org",
  });
});

test("the top bar lists the pages, marks the active one, and offers sign-in", async () => {
  serve({ "/v1/me": [401, {}] });
  const el = await render(<App path="/call" />);
  await until(() => expect(el.querySelector(".account")).not.toBeNull());
  expect([...el.querySelectorAll(".topbar nav a")].map((a) => a.textContent)).toEqual([
    "Simulate",
    "Call it",
    "Your record",
    "Receipts",
    "Scores",
  ]);
  expect(el.querySelector(".topbar nav [aria-current]")?.textContent).toBe("Call it");
  expect(el.querySelector(".account")?.textContent).toBe("Sign in");
  expect(el.querySelector(".sidebar")).toBeNull();
});

test("the home asks the post question, lists today's populations and links every use case", async () => {
  serve({ "/v1/me": [401, {}] });
  vi.mocked(rw.world).mockResolvedValue(world);
  vi.mocked(rw.status).mockResolvedValue(statusFixture as SystemStatus);
  const el = await render(<App path="/" />);
  expect(el.querySelector("h1")?.textContent).toBe("See how people react before you post.");
  expect(el.querySelector("main form button")?.textContent).toBe("Test my post");
  expect(el.querySelector(".example-slip .stamp")?.textContent).toBe("Example");
  expect([...el.querySelectorAll(".made-for strong")].map((x) => x.textContent)).toEqual([
    "Creators",
    "Small brands",
    "Founders",
    "Newsrooms",
  ]);
  // The ledger tape follows the home's content instead of leading it.
  expect(el.querySelector("main ~ .tape")).not.toBeNull();
  const form = el.querySelector<HTMLFormElement>("main form");
  expect(form?.getAttribute("action")).toBe("/simulate");
  expect(form?.querySelector("textarea")?.getAttribute("name")).toBe("text");
  await until(() =>
    expect(el.querySelectorAll(".register-rows li")).toHaveLength(world.countries.length),
  );
  expect(
    el.querySelectorAll(
      ".register-foot .seal-grid span.s0, .register-foot .seal-grid span.s1, .register-foot .seal-grid span.s2, .register-foot .seal-grid span.s3",
    ),
  ).toHaveLength(64);
  const links = [...el.querySelectorAll(".decision-rows a")].map((a) => a.getAttribute("href"));
  expect(links).toEqual(USE_CASES.map(caseHref));
  const text = el.textContent ?? "";
  for (const gone of [
    "Learn to simulate",
    "Primitive",
    "PRIMITIVE",
    "Quickstart",
    "in action",
    "Playground",
  ])
    expect(text).not.toContain(gone);
});

test("?text= starts the simulator with that post", async () => {
  serve({ "/v1/me": [401, {}] });
  history.replaceState(null, "", "/simulate?text=%20Half%20off%20today%20");
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.querySelector("#pg-text")).not.toBeNull());
  expect((el.querySelector("#pg-text") as HTMLTextAreaElement).value).toBe("Half off today");
  expect(
    (el.querySelector("input[name=primitive]:checked") as HTMLInputElement).parentElement
      ?.textContent,
  ).toBe("Test a post");
  history.replaceState(null, "", "/");
});

test("/playground is not a page", async () => {
  const el = await render(<App path="/playground" />);
  expect(el.textContent).toContain("Page not found");
});

test("the reaction slip draws 100 dots and a segment matrix", async () => {
  const countries = ["USA", "IND", "BRA"];
  const audiences = countries.flatMap((c, i) =>
    ["low", "high"].map((e, j) => ({
      segment: `${c}|18-34|${e}`,
      label: `${c} ${e}`,
      country: c,
      coverage_tier: "B",
      weight: 1 / 6,
      landing: 0.2 * (i + j + 1),
    })),
  );
  serve({
    "/v1/me": [401, {}],
    "/v1/tests": [200, { ...tested, result: { ...tested.result, audiences } }],
  });
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.querySelector("#pg-text")).not.toBeNull());
  await act(async () => typeInto(el.querySelector("#pg-text") as HTMLTextAreaElement, "Half off"));
  await act(async () => button("Test it").click());
  await until(() => expect(el.querySelector(".land-result")).not.toBeNull());
  expect(el.querySelector(".slip-quote")?.textContent).toBe("Half off");
  expect(el.querySelectorAll(".field span")).toHaveLength(100);
  const filled = el.querySelectorAll(".field span.on").length;
  expect(el.textContent).toContain(`Filled dots would like or share it: ${filled} of 100.`);
  const rows = [...el.querySelectorAll(".matrix tbody tr")];
  expect(rows).toHaveLength(countries.length);
  expect(rows[0].querySelectorAll("td")).toHaveLength(2);
  expect(el.querySelector(".matrix caption")?.textContent).toContain("6 segments asked");
  expect(el.querySelector(".seal-line .seal-grid.empty")).not.toBeNull();
});

test("the dot field fills exactly the headline's share of 100 dots", async () => {
  const ages = ["18-34", "35-54", "55+"];
  const synthetic = Array.from({ length: 24 }, (_, i) => ({
    segment: `C${i % 8}|${ages[i % 3]}|${["low", "mid", "high"][i % 3]}`,
    label: `segment ${i}`,
    country: `C${i % 8}`,
    coverage_tier: "B",
    weight: 1 + (i % 5),
    landing: ((i * 37) % 100) / 100,
  }));
  for (const [rows, chance] of [
    [tested.result.audiences, tested.result.landing_chance],
    [synthetic, 0.39],
    [synthetic, 0.985],
    [synthetic, 0.004],
  ] as const) {
    const el = await render(<PopulationField rows={[...rows]} landingChance={chance} />);
    expect(el.querySelectorAll(".field span")).toHaveLength(100);
    expect(el.querySelectorAll(".field span.on")).toHaveLength(Math.round(chance * 100));
    container.remove();
    container = document.body.appendChild(document.createElement("div"));
  }
});

test("the segment matrix keeps only the asked age band and education columns", async () => {
  const at = (country: string, age: string, edu: string) => ({
    ...segment(`${country} ${age} ${edu}`, 0.3),
    segment: `${country}|${age}|${edu}`,
    country,
  });
  const rows = [at("USA", "18-34", "low"), at("USA", "55+", "high"), at("MEX", "18-34", "high")];
  const el = await render(<SegmentMatrix rows={rows} />);
  const cells = (r: number) =>
    [...el.querySelectorAll(`thead tr:nth-child(${r}) th`)].map((t) => t.textContent);
  expect(cells(1)).toEqual(["Country", "18-34", "55+"]);
  expect(cells(2)).toEqual(["low", "high", "high"]);
  expect(el.querySelector("caption")?.textContent).toContain("3 segments asked");
});

test("a use case opens the simulator filled in", async () => {
  serve({ "/v1/me": [401, {}] });
  const u = USE_CASES.find((x) => x.primitive === "event") as (typeof USE_CASES)[number];
  history.replaceState(null, "", `/simulate?use=${u.id}`);
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.querySelector("#pg-text")).not.toBeNull());
  expect((el.querySelector("#pg-text") as HTMLTextAreaElement).value).toBe(u.text);
  expect(
    (el.querySelector("input[name=primitive]:checked") as HTMLInputElement).parentElement
      ?.textContent,
  ).toBe("Test an event");
  history.replaceState(null, "", "/");
});

test("an event run draws every topic and says it is not scored", async () => {
  serve({ "/v1/me": [401, {}] });
  const band = (p50: number) => ({ p10: p50 - 0.02, p50, p90: p50 + 0.02 });
  vi.spyOn(rw, "simulate").mockResolvedValue({ id: "job_1", status: "queued" } as never);
  vi.spyOn(rw, "wait").mockResolvedValue({
    simulated: true,
    disclosure: DISCLOSURE,
    world_snapshot_id: "2026-10-05",
    engine_version: "0.1.0",
    model: "jev-1.13.0",
    provider: "fake",
    seed: 1,
    members: 5,
    agents_sampled: 200,
    days: 7,
    cost: { estimated_usd: 0.01, actual_usd: 0 },
    coverage: [{ iso3: "USA", tier: "A" }],
    outputs: {
      inflation_worry: {
        baseline_share: 0.4,
        final: band(0.55),
        by_day: [{ day: 1, ...band(0.45) }],
      },
      tech_optimism: { baseline_share: 0.5, final: band(0.49), by_day: [{ day: 1, ...band(0.5) }] },
    },
    segments: [],
    top_shifts: [
      {
        segment: "USA|18-34|high",
        topic: "inflation_worry",
        shift_p10: 0.1,
        shift_p50: 0.15,
        shift_p90: 0.2,
        n_agents: 40,
        tier: "A",
      },
    ],
    top_shift_min_agents: 20,
    trace: { segment_signals: {}, agents: [] },
    note: "Counterfactual: not scored",
    content_hash: "",
  } as never);
  const el = await render(<App path="/simulate" />);
  await until(() => expect(el.querySelector("#pg-text")).not.toBeNull());
  await act(async () =>
    (el.querySelectorAll("input[name=primitive]")[1] as HTMLInputElement).click(),
  );
  await act(async () =>
    typeInto(el.querySelector("#pg-text") as HTMLTextAreaElement, "Rates fall"),
  );
  await act(async () => button("Test the event").click());
  await until(() => expect(el.querySelector(".event-result")).not.toBeNull());
  const text = el.querySelector(".event-result")?.textContent ?? "";
  for (const s of [
    "+15.0 pts",
    "Event · 7 simulated days from the world of 2026-10-05",
    "Rates fall",
    "40% → 55% (+15.0 pts)",
    "Inflation worry",
    "Tech optimism",
    "Counterfactual: not scored",
    "n = 40",
    DISCLOSURE,
  ])
    expect(text).toContain(s);
});

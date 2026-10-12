import type { Daily, ReceiptDay, Receipts } from "@real-world/sdk";
import { expect, test } from "vitest";
import { fixtureLeaks, shownQuestions } from "./liveCheck";

const real = {
  id: "usa-fomc-2026-10-28-unchanged",
  resolution_source: "https://www.federalreserve.gov/x",
};

test("fixture ids and example.com sources are leaks; real questions are not", () => {
  expect(fixtureLeaks([real])).toEqual([]);
  expect(
    fixtureLeaks([
      { id: "fx-a", resolution_source: "https://www.federalreserve.gov/x" },
      { id: "b", resolution_source: "https://example.com/fixture/b" },
      { id: "c", resolution_source: "https://sub.example.com/c" },
      { id: "d", resolution_source: "https://notexample.com/d" },
    ]),
  ).toEqual(["fx-a: fixture id", "b: source host example.com", "c: source host sub.example.com"]);
});

test("a source that is not a URL fails the check instead of passing", () => {
  expect(() => fixtureLeaks([{ id: "a", resolution_source: "not a url" }])).toThrow();
});

test("shown questions cover the daily question and every receipt day's forecasts", async () => {
  const rw = {
    daily: async () => ({ question: real }) as unknown as Daily,
    receipts: async () => ({ days: [{ date: "2026-10-14" }] }) as unknown as Receipts,
    receipt_day: async () =>
      ({
        entries: [
          { entry: { kind: "question_set" }, question: null },
          {
            entry: { kind: "forecast", question_id: "fx-old" },
            question: { resolution_source: "https://example.com/fixture/old" },
          },
        ],
      }) as unknown as ReceiptDay,
  };
  const shown = await shownQuestions(rw);
  expect(shown.map((q) => q.id)).toEqual([real.id, "fx-old"]);
  expect(fixtureLeaks(shown)).toEqual(["fx-old: fixture id", "fx-old: source host example.com"]);
});

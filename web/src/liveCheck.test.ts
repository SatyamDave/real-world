import type { Daily, ReceiptDay, Receipts } from "@real-world/sdk";
import { expect, test } from "vitest";
import { fixtureLeaks, shownQuestions } from "./liveCheck";

const real = {
  id: "usa-fomc-2026-10-28-unchanged",
  text: "Will the FOMC hold rates on Oct 28?",
  resolution_source: "https://www.federalreserve.gov/x",
};
const fed = real.resolution_source;

test("fixture ids, FIXTURE: text and example.com sources are leaks; real questions are not", () => {
  expect(fixtureLeaks([real])).toEqual([]);
  expect(
    fixtureLeaks([
      { id: "fx-a", text: "a", resolution_source: fed },
      { id: "b", text: "b", resolution_source: "https://example.com/fixture/b" },
      { id: "c", text: "c", resolution_source: "https://sub.example.com/c" },
      { id: "d", text: "d", resolution_source: "https://notexample.com/d" },
      { id: "e", text: "FIXTURE: Will the illustrative index rise?", resolution_source: fed },
    ]),
  ).toEqual([
    "fx-a: fixture id",
    "b: source host example.com",
    "c: source host sub.example.com",
    "e: fixture text",
  ]);
});

test("a source that is not a URL fails the check instead of passing", () => {
  expect(() => fixtureLeaks([{ id: "a", text: "a", resolution_source: "not a url" }])).toThrow();
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
            question: {
              text: "FIXTURE: old",
              resolution_source: "https://example.com/fixture/old",
            },
          },
        ],
      }) as unknown as ReceiptDay,
  };
  const shown = await shownQuestions(rw);
  expect(shown.map((q) => q.id)).toEqual([real.id, "fx-old"]);
  expect(fixtureLeaks(shown)).toEqual([
    "fx-old: fixture id",
    "fx-old: fixture text",
    "fx-old: source host example.com",
  ]);
});

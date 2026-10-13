import type { Daily } from "@real-world/sdk";
import { expect, test } from "vitest";
import dailyFixture from "./fixtures/daily.json";
import { square, weekShareText } from "./share";

const reveal = (dailyFixture as Daily).reveal;

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
    "Real World Call it, week to 2026-10-05",
    "⬜⬜🟩🟥🟩🟦🟦",
    "3 days answered in a row",
    "https://rw.test/receipts#2026-10-05",
  ]);
  expect(text).not.toContain("62");
});

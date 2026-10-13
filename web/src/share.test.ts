import type { Daily, PostTestOut } from "@real-world/sdk";
import { expect, test } from "vitest";
import dailyFixture from "./fixtures/daily.json";
import { postShareText, square, weekShareText } from "./share";

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

test("the post share line quotes the post, the landing chance, coverage and the seal", () => {
  const seg = (country: string, coverage_tier: string) => ({ country, coverage_tier });
  const out = {
    result: {
      landing_chance: 0.394,
      audiences: [seg("USA", "A"), seg("MEX", "B"), seg("USA", "A")],
    },
    seal: null,
  } as unknown as PostTestOut;
  expect(postShareText(out, "Half off", "https://rw.test")).toBe(
    '"Half off" lands with 39% of a simulated audience in 2 countries. AI-simulated, coverage A, B. Not sealed https://rw.test/simulate',
  );
  const sealed = {
    ...out,
    seal: { id: "pt_1", sha256: "ab".repeat(32), sealed_at: "2026-10-06T12:00:00Z" },
  } as PostTestOut;
  const long = "x".repeat(100);
  const text = postShareText(sealed, long, "https://rw.test");
  expect(text).toContain(`"${"x".repeat(79)}…"`);
  expect(text).toContain("Sealed 2026-10-06 · abababababab https://rw.test/simulate");
});

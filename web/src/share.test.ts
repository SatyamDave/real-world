import type { PostTestOut } from "@real-world/sdk";
import { expect, test } from "vitest";
import { postShareText } from "./share";

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

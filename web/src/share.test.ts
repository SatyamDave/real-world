import type { PostTestOut } from "@real-world/sdk";
import { expect, test } from "vitest";
import { postShareText } from "./share";

test("the post share line quotes the message, the intent and the seal", () => {
  const out = { result: { intent: 0.394 }, seal: null } as unknown as PostTestOut;
  expect(postShareText(out, "Half off", "https://rw.test")).toBe(
    '"Half off" would get 39% of simulated ideal customers to sign up, try or buy. AI-simulated, simulated from a description, not real customers. Not sealed https://rw.test/simulate',
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

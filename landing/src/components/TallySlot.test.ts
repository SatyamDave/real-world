import { expect, test } from "vitest";
import { isTallySubmit, tallyEmbedUrl } from "./TallySlot";

test("the embed URL carries the four hidden fields and hides the title", () => {
  const u = new URL(
    tallyEmbedUrl("abc123", { signupId: "s-1", deviceId: "d-1", variant: "hashed" }),
  );
  expect(u.origin + u.pathname).toBe("https://tally.so/embed/abc123");
  expect(Object.fromEntries(u.searchParams)).toMatchObject({
    signup_id: "s-1",
    device_id: "d-1",
    variant: "hashed",
    question_id: "fed-2026-10-28",
    hideTitle: "1",
  });
});

test("a missing device id is an empty hidden field, not the word null", () => {
  const u = new URL(tallyEmbedUrl("abc123", { signupId: "s-1", deviceId: null, variant: "x" }));
  expect(u.searchParams.get("device_id")).toBe("");
});

test("only Tally's own submit message counts", () => {
  expect(isTallySubmit("https://tally.so", { event: "Tally.FormSubmitted", payload: {} })).toBe(
    true,
  );
  expect(isTallySubmit("https://tally.so", "Tally.FormSubmitted")).toBe(true);
  expect(isTallySubmit("https://tally.so", { event: "Tally.FormLoaded" })).toBe(false);
  expect(isTallySubmit("https://evil.example", { event: "Tally.FormSubmitted" })).toBe(false);
  expect(isTallySubmit("https://tally.so", null)).toBe(false);
});

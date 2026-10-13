import { expect, test } from "vitest";
import { tallyEmbedUrl, tallyEvent } from "./TallySlot";

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

test("only Tally's own messages count, by name", () => {
  const t = "https://tally.so";
  expect(tallyEvent(t, { event: "Tally.FormSubmitted", payload: {} })).toBe("Tally.FormSubmitted");
  expect(tallyEvent(t, "Tally.FormLoaded")).toBe("Tally.FormLoaded");
  expect(tallyEvent(t, { event: "something.else" })).toBeNull();
  expect(tallyEvent("https://evil.example", { event: "Tally.FormSubmitted" })).toBeNull();
  expect(tallyEvent(t, null)).toBeNull();
});

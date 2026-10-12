import { expect, test } from "vitest";
import { DEFAULT_HEADLINE_ID, HEADLINES, resolveHeadline } from "./headlines";

test("a known utm_content returns its headline", () => {
  for (const id of Object.keys(HEADLINES)) {
    expect(resolveHeadline(id).id).toBe(id);
  }
});

test("utm_content matching is case-insensitive and trimmed", () => {
  expect(resolveHeadline("  HASHED ").id).toBe("hashed");
});

test("an unknown or missing utm_content falls back to the default", () => {
  expect(resolveHeadline("not-a-real-id").id).toBe(DEFAULT_HEADLINE_ID);
  expect(resolveHeadline(null).id).toBe(DEFAULT_HEADLINE_ID);
  expect(resolveHeadline(undefined).id).toBe(DEFAULT_HEADLINE_ID);
  expect(resolveHeadline("").id).toBe(DEFAULT_HEADLINE_ID);
});

test("every headline avoids forbidden claims (no %, beats, world model, 100k)", () => {
  const forbidden = /%|beats the market|world model|100,?000 agents|accurate/i;
  for (const h of Object.values(HEADLINES)) {
    expect(`${h.h1} ${h.sub}`).not.toMatch(forbidden);
  }
});

import { expect, test } from "vitest";
import { findUseCase, USE_CASES } from "./usecases";

test("15 consumer use cases, each with an idea, an ideal consumer and a message", () => {
  expect(USE_CASES).toHaveLength(15);
  expect(new Set(USE_CASES.map((u) => u.id)).size).toBe(15);
  for (const u of USE_CASES) {
    for (const f of [u.idea, u.icp, u.message]) expect(f.trim().length).toBeGreaterThan(10);
    expect(u.message.length).toBeLessThanOrEqual(500);
    expect(findUseCase(u.id)).toBe(u);
  }
});

test("the use cases span every consumer category", () => {
  const categories = new Set(USE_CASES.map((u) => u.category));
  for (const c of [
    "Consumer app",
    "E-commerce and DTC",
    "Marketplace",
    "Consumer fintech",
    "Health",
    "Hardware",
    "Local services",
    "Creator tools",
    "Consumer AI",
    "Games",
    "Food",
    "Travel",
    "Education",
  ])
    expect(categories).toContain(c);
});

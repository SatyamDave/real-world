import { expect, test } from "vitest";
import { BRAND } from "../brand";
import { CONSENT_TEXT, CONSENT_VERSION } from "./consent";

// The brand name lives only in src/brand.ts (decision 0004). The consent line is stored with a
// version, so changing its wording means changing the version; this pins both.
test("the consent line uses the brand name from brand.ts and keeps its version and wording", () => {
  expect(CONSENT_TEXT).toContain(BRAND.name);
  expect(CONSENT_TEXT).toBe(
    "We'll email you about Real World's launch and your forecast. Unsubscribe anytime.",
  );
  expect(CONSENT_VERSION).toBe("2026-10-12");
});

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const FORM_BUTTON = "form.signup button[type=submit]";

async function mockSignup(
  page: Page,
  reply: { status: number; body: Record<string, unknown> },
): Promise<{ bodies: Record<string, unknown>[] }> {
  const seen = { bodies: [] as Record<string, unknown>[] };
  await page.route("**/api/signup", async (route) => {
    seen.bodies.push(route.request().postDataJSON());
    await route.fulfill({
      status: reply.status,
      contentType: "application/json",
      body: JSON.stringify(reply.body),
    });
  });
  return seen;
}

async function submit(page: Page, email: string) {
  await page.fill("#email", email);
  await page.click(FORM_BUTTON);
}

test.describe("page", () => {
  test("renders the headline, the receipt strip and no overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Simulations with receipts.");
    await expect(page.getByRole("heading", { name: "The first receipts." })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the headline follows utm_content and falls back for unknown values", async ({ page }) => {
    await page.goto("/?utm_content=hashed");
    await expect(page.locator("h1")).toHaveText("Forecasts, hashed before the outcome.");
    await page.goto("/?utm_content=not-a-real-id");
    await expect(page.locator("h1")).toHaveText("Simulations with receipts.");
  });

  test("receipt cards are pending, AI-simulated, and show no hash or probability", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = page.locator(".receipt");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await expect(card).toContainText("Pending");
      await expect(card).toContainText("AI-simulated");
    }
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/\b[0-9a-f]{32,}\b/i);
    expect(text).not.toMatch(/\b\d{1,3}(\.\d+)?\s?%/);
  });

  test("See the receipts scrolls the strip into view", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "See the receipts" }).click();
    await expect(page.getByRole("heading", { name: "The first receipts." })).toBeInViewport();
  });

  test("the sideways receipt list is a keyboard stop on a phone only", async ({ page }, info) => {
    await page.goto("/");
    const region = page.locator(".receipts-scroll");
    if (info.project.name === "mobile") {
      await expect(region).toHaveAttribute("tabindex", "0");
      await region.focus();
      const before = await region.evaluate((el) => el.scrollLeft);
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
    } else {
      await expect(region).not.toHaveAttribute("tabindex", /.*/);
    }
  });
});

test.describe("signup (API mocked)", () => {
  test("a new email saves, sends the context, and moves focus to the result", async ({ page }) => {
    const seen = await mockSignup(page, {
      status: 200,
      body: { signup_id: "00000000-0000-4000-8000-000000000001", duplicate: false },
    });
    await page.goto("/?utm_source=reddit&utm_content=hashed");
    await submit(page, "  Test@Example.com ");
    await expect(page.getByRole("heading", { name: "You're in." })).toBeFocused();
    expect(seen.bodies).toHaveLength(1);
    expect(seen.bodies[0]).toMatchObject({
      email: "Test@Example.com",
      headlineVariant: "hashed",
      consentVersion: "2026-10-12",
      utm: { utm_source: "reddit", utm_content: "hashed" },
    });
  });

  test("a duplicate email says so", async ({ page }) => {
    await mockSignup(page, { status: 200, body: { signup_id: "s1", duplicate: true } });
    await page.goto("/");
    await submit(page, "dup@example.com");
    await expect(page.getByRole("heading", { name: "You're already on the list." })).toBeVisible();
  });

  test("an invalid email is caught before any request", async ({ page }) => {
    const seen = await mockSignup(page, { status: 200, body: {} });
    await page.goto("/");
    await submit(page, "not-an-email");
    await expect(page.getByRole("alert")).toContainText(
      "Enter an email address like you@email.com.",
    );
    await expect(page.locator("#email")).toHaveAttribute("aria-invalid", "true");
    expect(seen.bodies).toHaveLength(0);
  });

  for (const [name, status, body, text] of [
    [
      "a network or server error",
      500,
      {},
      "That didn't save. Check your connection and try again.",
    ],
    ["a failed bot check", 400, { error: "bot_check_failed" }, "Reload the page and try again."],
    ["a rate limit", 429, { error: "rate_limited" }, "Wait a few minutes and try again."],
  ] as const) {
    test(`${name} shows what to do`, async ({ page }) => {
      await mockSignup(page, { status, body });
      await page.goto("/");
      await submit(page, "ok@example.com");
      await expect(page.getByRole("alert")).toContainText(text);
    });
  }
});

test.describe("globe", () => {
  test("with WebGL the animated globe appears", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".globe-canvas.ready")).toBeVisible({ timeout: 10_000 });
  });

  test("without WebGL the poster stays and the chips still appear", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === "webgl" || type === "experimental-webgl" || type === "webgl2") return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    await page.goto("/");
    await expect(page.locator(".globe-poster")).toBeVisible();
    await expect(page.locator(".globe-canvas.ready")).toHaveCount(0);
    await expect(page.locator(".stage")).toHaveAttribute("data-phase", "static");
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("the poster is the only visual and the chips are shown at once", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".globe-poster")).toBeVisible();
      await expect(page.locator(".globe-canvas")).toBeHidden();
      await expect(page.locator(".stage")).toHaveAttribute("data-phase", "static");
      const chipOpacity = await page
        .locator(".chip-1")
        .evaluate((el) => getComputedStyle(el).opacity);
      expect(chipOpacity).toBe("1");
    });
  });
});

test.describe("legal pages", () => {
  test("privacy lists the processors and is marked as a draft", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator(".draft-banner")).toContainText("reviewed by the founders");
    const text = await page.locator("main").innerText();
    for (const name of ["Cloudflare", "Neon", "Amplitude", "Typeform", "Reddit", "X "]) {
      expect(text).toContain(name);
    }
    expect(text).toContain("We do not sell your data.");
    // What the code really stores and sends, so the page cannot drift from it.
    expect(text).toContain("random device id");
    expect(text).toContain("local storage");
    expect(text).toContain("Typeform keeps them");
    expect(text).toContain("not meant for children under 13");
  });

  test("terms say AI-simulated and no betting", async ({ page }) => {
    await page.goto("/terms");
    const text = await page.locator("main").innerText();
    expect(text).toContain("AI-simulated");
    expect(text).toContain("not a way to bet or trade");
  });
});

test.describe("accessibility (axe, WCAG 2.1 A and AA)", () => {
  for (const path of ["/", "/privacy", "/terms"]) {
    test(`${path} has no violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(500);
      // The anchored chips fade in on a timer; axe must not measure contrast mid-fade.
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY)
            .map((a) => a.finished.catch(() => undefined)),
        ),
      );
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
    });
  }

  test("/ has no violations with the invalid-email message showing", async ({ page }) => {
    await page.goto("/");
    await submit(page, "nope");
    await expect(page.getByRole("alert")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

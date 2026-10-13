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
    await expect(page.locator("h1")).toHaveText("Know how a post will land before you post it.");
    await expect(page.getByRole("heading", { name: "The first receipts." })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the headline follows utm_content and falls back for unknown values", async ({ page }) => {
    await page.goto("/?utm_content=hashed");
    await expect(page.locator("h1")).toHaveText("Forecasts, hashed before the outcome.");
    await page.goto("/?utm_content=receipts");
    await expect(page.locator("h1")).toHaveText("Simulations with receipts.");
    await page.goto("/?utm_content=not-a-real-id");
    await expect(page.locator("h1")).toHaveText("Know how a post will land before you post it.");
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

const NO_WEBGL = () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    ...rest: unknown[]
  ) {
    if (type === "webgl" || type === "experimental-webgl" || type === "webgl2") return null;
    return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
  } as typeof original;
};

const FED = 'button.globe-marker[aria-label*="Fed"]';
const ECB = 'button.globe-marker[aria-label*="ECB"]';

/** Where a marker sits on the globe, as the fractions its style says. */
async function at(page: Page, selector: string) {
  return page.locator(selector).evaluate((el) => ({
    x: Number.parseFloat((el as HTMLElement).style.left),
    y: Number.parseFloat((el as HTMLElement).style.top),
  }));
}
/** The distance between the Fed and ECB markers: it grows as the globe zooms in. */
async function spread(page: Page) {
  const [a, b] = [await at(page, FED), await at(page, ECB)];
  return Math.hypot(a.x - b.x, a.y - b.y);
}
async function liveGlobe(page: Page) {
  await page.goto("/");
  await expect(page.locator(".globe-canvas.ready")).toBeVisible({ timeout: 10_000 });
  await page.locator(".globe-holder").scrollIntoViewIfNeeded();
  await expect(page.locator(FED)).toBeVisible();
  // A person points at the globe before pressing a marker, and the idle spin waits while they do.
  const box = await page.locator(".globe-holder").boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}
async function centre(page: Page) {
  const box = await page.locator(".globe-holder").boundingBox();
  if (!box) throw new Error("no globe");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

test.describe("globe", () => {
  test("with WebGL the live globe appears with its controls and a marker per question", async ({
    page,
  }) => {
    await liveGlobe(page);
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset the view" })).toBeVisible();
    await expect(page.locator(FED)).toBeVisible();
    await expect(page.locator(ECB)).toBeVisible();
  });

  test("a marker opens its pending receipt and Make your call goes to the waitlist field", async ({
    page,
  }) => {
    await liveGlobe(page);
    await page.locator(FED).click();
    const card = page.locator("#globe-card");
    await expect(card).toContainText("Federal Reserve");
    await expect(card).toContainText("Pending");
    await expect(card).toContainText("AI-simulated");
    await expect(card.getByRole("button", { name: "Make your call" })).toBeVisible();
    await card.getByRole("button", { name: "Make your call" }).click();
    await expect(page.locator("#globe-card")).toHaveCount(0);
    await expect(page.locator("#email")).toBeFocused();
  });

  test("Escape closes the card and returns focus to the marker", async ({ page }) => {
    await liveGlobe(page);
    await page.locator(FED).click();
    await expect(page.locator("#globe-card")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#globe-card")).toHaveCount(0);
    await expect(page.locator(FED)).toBeFocused();
  });

  test("dragging with a mouse turns the globe and it coasts, then settles", async ({
    page,
  }, info) => {
    test.skip(info.project.name === "mobile", "touch is tested separately");
    await liveGlobe(page);
    const { x, y } = await centre(page);
    const before = await at(page, FED);
    await page.mouse.move(x - 60, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y, { steps: 6 });
    await page.mouse.move(x + 80, y, { steps: 6 });
    const during = await at(page, FED);
    await page.mouse.up();
    expect(Math.abs(during.x - before.x)).toBeGreaterThan(1);
    // After letting go it keeps moving for a moment (inertia) ...
    await page.waitForTimeout(80);
    const early = await at(page, FED);
    await page.waitForTimeout(250);
    const later = await at(page, FED);
    expect(Math.abs(later.x - early.x)).toBeGreaterThan(0.05);
    // ... and then it has stopped (the idle spin waits four seconds).
    await page.waitForTimeout(2500);
    const a = await at(page, FED);
    await page.waitForTimeout(400);
    const b = await at(page, FED);
    expect(Math.abs(a.x - b.x)).toBeLessThan(0.05);
  });

  test("a plain wheel over the globe scrolls the page; ctrl or cmd plus wheel zooms it", async ({
    page,
  }) => {
    await liveGlobe(page);
    const { x, y } = await centre(page);
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0);
    await page.locator(".globe-holder").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const s0 = await spread(page);
    const prevented = await page.locator(".globe-holder").evaluate((el) => {
      const e = new WheelEvent("wheel", {
        deltaY: -240,
        ctrlKey: true,
        cancelable: true,
        bubbles: true,
      });
      el.dispatchEvent(e);
      return e.defaultPrevented;
    });
    expect(prevented).toBe(true);
    await page.waitForTimeout(300);
    expect(await spread(page)).toBeGreaterThan(s0 * 1.2);
  });

  test("the plus, minus and reset buttons zoom and restore the view", async ({ page }) => {
    await liveGlobe(page);
    await page.mouse.move(0, 0);
    const home = await at(page, FED);
    const s0 = await spread(page);
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.waitForTimeout(250);
    expect(await spread(page)).toBeGreaterThan(s0 * 1.3);
    await page.getByRole("button", { name: "Zoom out" }).click();
    await page.getByRole("button", { name: "Reset the view" }).click();
    await page.waitForTimeout(900);
    const back = await at(page, FED);
    expect(Math.abs(back.x - home.x)).toBeLessThan(2);
    expect(Math.abs(back.y - home.y)).toBeLessThan(2);
  });

  test("the keyboard turns and zooms the globe", async ({ page }) => {
    await liveGlobe(page);
    await page.locator(".globe-holder").focus();
    const before = await at(page, FED);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    expect(Math.abs((await at(page, FED)).x - before.x)).toBeGreaterThan(1);
    const s0 = await spread(page);
    await page.keyboard.press("+");
    await page.waitForTimeout(200);
    expect(await spread(page)).toBeGreaterThan(s0);
    await page.keyboard.press("0");
    await page.waitForTimeout(900);
    expect(Math.abs((await at(page, FED)).x - before.x)).toBeLessThan(2);
  });

  test("touch: a vertical swipe scrolls the page, a horizontal one turns the globe, a pinch zooms", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "mobile", "needs a touch device");
    await liveGlobe(page);
    const { x, y } = await centre(page);
    const cdp = await page.context().newCDPSession(page);
    const y0 = await page.evaluate(() => window.scrollY);
    await cdp.send("Input.synthesizeScrollGesture", {
      x,
      y,
      yDistance: -200,
      gestureSourceType: "touch",
    });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 50);
    await page.locator(".globe-holder").scrollIntoViewIfNeeded();
    const { x: cx, y: cy } = await centre(page);
    const before = await at(page, FED);
    await cdp.send("Input.synthesizeScrollGesture", {
      x: cx,
      y: cy,
      xDistance: -120,
      gestureSourceType: "touch",
    });
    await page.waitForTimeout(500);
    expect(Math.abs((await at(page, FED)).x - before.x)).toBeGreaterThan(1);
    const s0 = await spread(page);
    await cdp.send("Input.synthesizePinchGesture", {
      x: cx,
      y: cy,
      scaleFactor: 1.8,
      gestureSourceType: "touch",
    });
    await page.waitForTimeout(500);
    expect(await spread(page)).toBeGreaterThan(s0 * 1.2);
  });

  test("without WebGL the poster stays, with the markers still openable", async ({ page }) => {
    await page.addInitScript(NO_WEBGL);
    await page.goto("/");
    await expect(page.locator(".globe-poster")).toBeVisible();
    await expect(page.locator(".globe-canvas.ready")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Zoom in" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Make the globe interactive" })).toHaveCount(0);
    await expect(page.locator(FED)).toBeVisible();
    await page.locator(FED).click();
    await expect(page.locator("#globe-card")).toContainText("Federal Reserve");
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the poster comes first and nothing loads until the visitor asks", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1500);
      await expect(page.locator(".globe-poster")).toBeVisible();
      await expect(page.locator(".globe-canvas.ready")).toHaveCount(0);
      await expect(page.locator(FED)).toBeVisible();
      await expect(page.getByRole("button", { name: "Make the globe interactive" })).toBeVisible();
    });

    test("once asked for, the globe turns only under the visitor's hand: no spin, no coasting", async ({
      page,
    }, info) => {
      test.skip(info.project.name === "mobile", "a mouse drag");
      await page.goto("/");
      await page.getByRole("button", { name: "Make the globe interactive" }).click();
      await expect(page.locator(".globe-canvas.ready")).toBeVisible({ timeout: 10_000 });
      const idle = await at(page, FED);
      await page.waitForTimeout(1200);
      expect(Math.abs((await at(page, FED)).x - idle.x)).toBeLessThan(0.05); // no auto-spin
      const { x, y } = await centre(page);
      await page.mouse.move(x - 40, y);
      await page.mouse.down();
      await page.mouse.move(x + 60, y, { steps: 8 });
      await page.mouse.up();
      const released = await at(page, FED);
      expect(Math.abs(released.x - idle.x)).toBeGreaterThan(1);
      await page.waitForTimeout(600);
      expect(Math.abs((await at(page, FED)).x - released.x)).toBeLessThan(0.05); // no inertia
    });
  });
});

test.describe("the first screen", () => {
  test("shows the headline, the field and its button without scrolling, with the cookie notice up", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeInViewport();
    await expect(page.locator("#email")).toBeInViewport();
    await expect(page.locator("form.signup button[type=submit]")).toBeInViewport();
    await expect(page.locator(".cookie-notice")).toBeVisible();
    // The notice is a bar on the bottom edge and does not cover the button.
    const bar = await page.locator(".cookie-notice").boundingBox();
    const button = await page.locator("form.signup button[type=submit]").boundingBox();
    if (!bar || !button) throw new Error("missing");
    expect(button.y + button.height).toBeLessThanOrEqual(bar.y);
  });
});

test.describe("sections below the receipts", () => {
  test("thesis, research and collaboration render, with the waitlist still the one action", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "A forecast is only worth something if you can check it.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Research and limits" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Work on this with us." })).toBeVisible();
    // No demo and no app link: nothing here depends on APP_URL.
    await expect(page.getByText(/try today's question|demo/i)).toHaveCount(0);
    // One primary form on the page.
    await expect(page.locator("form.signup")).toHaveCount(1);
  });

  test("the collaboration action points back to the waitlist field until a contact address exists", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Join the waitlist and choose your role" }).click();
    await expect(page.locator("#email")).toBeFocused();
  });
});

test.describe("pre-rendered home page", () => {
  test("with JavaScript off the headline, the email field and the globe poster are in the HTML", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Know how a post will land before you post it.");
    await expect(page.locator("#email")).toHaveCount(1);
    await expect(page.locator("img.globe-poster")).toHaveCount(1);
    await context.close();
  });

  for (const [id, h1] of [
    ["hashed", "Forecasts, hashed before the outcome."],
    ["public-score", "We publish our misses."],
    ["your-call", "Make your call before the world does."],
  ] as const) {
    test(`utm_content=${id} hydrates cleanly with its own headline`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/?utm_content=${id}`);
      await page.waitForTimeout(1200);
      await expect(page.locator("h1")).toHaveText(h1);
      await page.fill("#email", "a@b.co");
      await expect(page.locator("#email")).toHaveValue("a@b.co");
      expect(errors).toEqual([]);
    });
  }

  test("privacy and terms do not show the home markup", async ({ page }) => {
    for (const path of ["/privacy", "/terms"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("img.globe-poster")).toHaveCount(0);
    }
  });
});

test.describe("legal pages", () => {
  test("privacy lists the processors and is marked as a draft", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator(".draft-banner")).toContainText("reviewed by the founders");
    const text = await page.locator("main").innerText();
    for (const name of ["Cloudflare", "Neon", "Amplitude", "Tally", "Reddit", "X "]) {
      expect(text).toContain(name);
    }
    expect(text).toContain("We do not sell your data.");
    // What the code really stores and sends, so the page cannot drift from it.
    expect(text).toContain("random device id");
    expect(text).toContain("local storage");
    expect(text).toContain("Tally keeps them");
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

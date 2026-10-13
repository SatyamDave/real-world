// Screenshots at 390x844 and 1440x900, light and dark, for the critique rounds (design/c-rounds/).
// Usage: node scripts/shoot.mjs <outprefix> [url]   (a vite preview must be running on 4311)
import { chromium } from "@playwright/test";

const out = process.argv[2];
const url = process.argv[3] ?? "http://localhost:4311/";
const browser = await chromium.launch({ channel: "chrome" });
const sizes = [
  ["390", { width: 390, height: 844 }, 2, true],
  ["1440", { width: 1440, height: 900 }, 1, false],
];
for (const scheme of ["light", "dark"]) {
  for (const [name, vp, dpr, mobile] of sizes) {
    const ctx = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: dpr,
      isMobile: mobile,
      hasTouch: mobile,
      colorScheme: scheme,
    });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${out}-${name}-${scheme}-fold.png` });
    if (scheme === "light") {
      // open the Fed receipt on the globe
      await page.locator(".globe-holder").evaluate((e) => e.scrollIntoView({ block: "center" }));
      const box = await page.locator(".globe-holder").boundingBox();
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(400);
      const fed = page.locator('button.globe-marker[aria-label*="Fed"]');
      if (await fed.count()) {
        await fed
          .first()
          .click({ timeout: 4000 })
          .catch(() => {});
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: `${out}-${name}-light-globe.png` });
      await page.mouse.move(0, 0);
    }
    // full page, after a slow scroll so everything settles
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}-${name}-${scheme}-full.png`, fullPage: true });
    await ctx.close();
  }
}
await browser.close();

// Drives the deployed staging page like a visitor: signup, then the real Typeform embed.
// Prints ids only (signup id, device id, session id), never the email or any secret, so the
// rows can be checked and deleted by id. Staging data only: BASE must be the preview URL.
// Usage: node scripts/verify-staging.mjs [--typeform]
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "https://landing-preview.real-world-landing.pages.dev";
if (!BASE.includes("landing-preview")) throw new Error("refusing: BASE is not the staging preview");
const withTypeform = process.argv.includes("--typeform");
const stamp = Date.now();
const email = `verify-${stamp}@example.com`;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on(
  "console",
  (m) =>
    ["warning", "error"].includes(m.type()) && logs.push(`${m.type()}: ${m.text().slice(0, 160)}`),
);
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message.slice(0, 160)}`));

await page.goto(
  `${BASE}/?utm_source=verify&utm_medium=test&utm_campaign=staging_verify_${stamp}&utm_content=hashed`,
);
await page.waitForTimeout(2500);
await page.fill("#email", email);
const resp = page.waitForResponse(
  (r) => r.url().endsWith("/api/signup") && r.request().method() === "POST",
);
await page.click("form.signup button[type=submit]");
const r = await resp;
const signup = await r.json();
console.log("signup status", r.status(), "signup_id", signup.signup_id);

const deviceId = await page.evaluate(() => {
  try {
    return (
      JSON.parse(
        localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("AMP_")) ?? "") ??
          "{}",
      ).deviceId ?? null
    );
  } catch {
    return null;
  }
});
console.log("device_id", deviceId);

if (withTypeform) {
  const frame = page.frameLocator(".typeform-embed iframe");
  await frame.locator("input").first().waitFor({ timeout: 30000 });
  await page.screenshot({ path: process.env.SHOT ?? "/tmp/tf-1.png" });
  await frame.locator("input").first().fill("62");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  await frame.getByText("Just curious").first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: (process.env.SHOT ?? "/tmp/tf-1.png").replace("1", "2") });
  // The choice may auto-advance to submit; click Submit if it is shown.
  const submit = frame.getByRole("button", { name: /submit/i });
  if (await submit.count()) await submit.first().click();
  await frame
    .getByText(/on the list/i)
    .first()
    .waitFor({ timeout: 30000 });
  console.log("typeform: thank-you screen shown");
  await page.waitForTimeout(8000);
}
await page.waitForTimeout(3000);
console.log("console problems:", logs.length ? logs : "none");
await browser.close();

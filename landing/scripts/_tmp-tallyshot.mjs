import { chromium } from "@playwright/test";

const id = process.argv[2];
const out = process.argv[3];
const browser = await chromium.launch({ channel: "chrome" });
for (const [name, vp] of [
  ["390", { width: 390, height: 844 }],
  ["1440", { width: 1440, height: 900 }],
]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: name === "390" ? 2 : 1 });
  const html = `<!doctype html><body style="margin:0;background:#f2f4f3;font-family:sans-serif"><div style="max-width:560px;margin:24px auto;padding:0 16px"><p style="color:#5c6660">Host page (ours): the form sits in a bordered box.</p><div style="border:1.5px solid #cdd3cf;border-radius:4px"><iframe title="t" style="display:block;width:100%;height:520px;border:0" src="https://tally.so/embed/${id}?hideTitle=1&transparentBackground=1&signup_id=test&device_id=test&variant=x&question_id=q"></iframe></div></div></body>`;
  await page.setContent(html);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${out}-${name}.png`, fullPage: true });
  const frame = page.frames().find((f) => f.url().includes("tally.so"));
  const text = frame
    ? await frame.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => "(no access)")
    : "(no frame)";
  console.log(name, "frame:", !!frame, "text:", JSON.stringify(text));
  await page.close();
}
await browser.close();

#!/usr/bin/env node
// Renders the ad images: one PNG per headline id and size, into landing/ads/.
// Text comes from src/copy/headlines.ts and src/brand.ts through Vite, so the ads
// can never drift from the allow-list in gtm/prelaunch-ads.md. Before rendering,
// every line is checked against the claims gtm/messaging.md forbids and the
// no-politics rule; the script stops if any line trips a check.
//
//   pnpm --filter landing ads
//
// Needs Google Chrome (or run `pnpm exec playwright install chromium` and drop the
// channel) and network access for the IBM Plex fonts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "ads");
mkdirSync(outDir, { recursive: true });

// Our own conservative safe zones, in pixels. These are not vendor specifications:
// Reddit and X safe zones are unverified (product/101), so we keep all text well
// inside the common story-format margins and let only the decorative globe bleed.
const SIZES = {
  square: { w: 1080, h: 1080, top: 90, bottom: 90, side: 90, h1: 88, sub: 36 },
  portrait: { w: 1080, h: 1350, top: 110, bottom: 110, side: 90, h1: 100, sub: 40 },
  story: { w: 1080, h: 1920, top: 250, bottom: 340, side: 90, h1: 112, sub: 44 },
};

// Claims gtm/messaging.md forbids, plus the no-politics rule in gtm/prelaunch-ads.md.
const FORBIDDEN = [
  [/\d\s?%/, "a percentage"],
  [/beats?\b|outperform|ahead of the market/i, "a ranking claim"],
  [/world model/i, "'world model'"],
  [/\b100\s?(k|,000|000)\b|\bagents?\b/i, "an agent count"],
  [/\bbet\b|\btrade\b|\bodds\b/i, "a trading offer"],
  [/elect|vote|ballot|candidate|president|party|senate|congress|policy/i, "political content"],
  [/accura/i, "an accuracy claim"],
];

const server = await createServer({
  root,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});
const { HEADLINES } = await server.ssrLoadModule("/src/copy/headlines.ts");
const { BRAND } = await server.ssrLoadModule("/src/brand.ts");
await server.close();

const tokens = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
const token = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
const C = {
  paper: token("paper"),
  ink: token("ink"),
  accent: token("accent"),
  muted: token("muted"),
};
if (Object.values(C).some((v) => !v)) throw new Error("could not read colour tokens");

const poster = readFileSync(join(root, "public/globe-poster.svg"), "utf8");
const posterUri = `data:image/svg+xml;base64,${Buffer.from(poster).toString("base64")}`;
const DISCLOSURE = "AI-simulated. Not a poll.";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function page(headline, size) {
  const globe = size.w * 0.42;
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:${size.w}px;height:${size.h}px;background:${C.paper};color:${C.ink};font-family:"IBM Plex Sans",sans-serif;position:relative;overflow:hidden}
.text{position:absolute;left:${size.side}px;right:${size.side}px;top:${size.top}px;bottom:${size.bottom}px;display:flex;flex-direction:column}
.brand{font-weight:600;font-size:40px;letter-spacing:-0.01em;margin-bottom:${size.h > 1500 ? 64 : 40}px}
.dot{color:${C.accent}}
h1{font-weight:600;font-size:${size.h1}px;line-height:1.02;letter-spacing:-0.035em;margin-bottom:32px;max-width:${size.w - 2 * size.side}px}
.sub{font-size:${size.sub}px;line-height:1.38;max-width:${Math.round((size.w - 2 * size.side) * 0.66)}px}
.foot{margin-top:auto;font-size:30px;color:${C.muted};max-width:420px}
.globe{position:absolute;width:${globe}px;height:${globe}px;right:${-globe * 0.22}px;bottom:${size.h > 1500 ? size.bottom - 40 : -globe * 0.2}px;opacity:.95}
</style></head><body>
<img class="globe" src="${posterUri}" alt="">
<div class="text">
<div class="brand">${esc(BRAND.name)}<span class="dot">.</span></div>
<h1>${esc(headline.h1)}</h1>
<p class="sub">${esc(headline.sub)}</p>
<p class="foot">${esc(DISCLOSURE)}</p>
</div></body></html>`;
}

for (const h of Object.values(HEADLINES)) {
  for (const text of [h.h1, h.sub, DISCLOSURE, BRAND.name]) {
    for (const [re, what] of FORBIDDEN) {
      if (re.test(text)) throw new Error(`headline "${h.id}" trips the check for ${what}: ${text}`);
    }
  }
}

const browser = await chromium.launch({ channel: "chrome" });
const manifest = [];
try {
  for (const h of Object.values(HEADLINES)) {
    for (const [name, size] of Object.entries(SIZES)) {
      const ctx = await browser.newContext({
        viewport: { width: size.w, height: size.h },
        deviceScaleFactor: 1,
      });
      const p = await ctx.newPage();
      await p.setContent(page(h, size), { waitUntil: "networkidle" });
      await p.evaluate(() => document.fonts.ready);
      if (!(await p.evaluate(() => document.fonts.check('600 40px "IBM Plex Sans"')))) {
        throw new Error("IBM Plex Sans did not load; check the network and run again");
      }
      // Text must stay inside the safe zone.
      const box = await p.evaluate(() => {
        const r = document.querySelector(".text").getBoundingClientRect();
        const last = [...document.querySelectorAll(".text > *")].map((e) =>
          e.getBoundingClientRect(),
        );
        return {
          zone: r.toJSON(),
          maxBottom: Math.max(...last.map((b) => b.bottom)),
          maxRight: Math.max(...last.map((b) => b.right)),
        };
      });
      if (box.maxBottom > box.zone.bottom + 1 || box.maxRight > box.zone.right + 1) {
        throw new Error(`text overflows the safe zone for ${h.id} at ${name}`);
      }
      const file = `${h.id}-${size.w}x${size.h}.png`;
      await p.screenshot({ path: join(outDir, file) });
      manifest.push({ headline_id: h.id, size: `${size.w}x${size.h}`, format: name, file });
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}
writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${manifest.length} images to landing/ads/`);

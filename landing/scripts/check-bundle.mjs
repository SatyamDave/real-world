#!/usr/bin/env node
// Fails when the JavaScript the page loads before first paint is over the budget.
// "Before first paint" means what dist/index.html references: the entry script and
// its modulepreloads. Dynamic chunks (cobe, Typeform, Amplitude, session replay,
// pixels) are loaded later and are listed for information only.
//
//   pnpm --filter landing build && pnpm --filter landing check:bundle
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 120; // gzipped, product/landing-page.md budget (LCP 2.0s, CLS 0.05, JS 120 KB)
const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const html = readFileSync(join(dist, "index.html"), "utf8");

const gz = (file) => gzipSync(readFileSync(join(dist, file))).length;
const initial = new Set(
  [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]),
);
if (initial.size === 0) {
  console.error("no script found in dist/index.html; run the build first");
  process.exit(1);
}

const all = readdirSync(join(dist, "assets")).filter((f) => f.endsWith(".js"));
let total = 0;
console.log("loaded before first paint:");
for (const f of initial) {
  const size = gz(f);
  total += size;
  console.log(`  ${f}  ${(size / 1024).toFixed(1)} KB gzipped`);
}
console.log("loaded later (not counted):");
for (const f of all.filter((f) => !initial.has(`assets/${f}`))) {
  console.log(`  assets/${f}  ${(gz(`assets/${f}`) / 1024).toFixed(1)} KB gzipped`);
}
const kb = total / 1024;
console.log(`first-load JS: ${kb.toFixed(1)} KB gzipped (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) {
  console.error("over budget");
  process.exit(1);
}

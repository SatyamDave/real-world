// Pre-renders the home page into dist/index.html after `vite build`, so the hero (and the
// globe poster, the largest element on screen) is in the HTML and paints before any
// JavaScript runs. React then hydrates it. Run by `pnpm build` and scripts/build.mjs with the
// same VITE_* values as the build, because a few components read them.
//
// Two details keep hydration honest:
//  - the markup is the default headline; a tiny inline script swaps the h1 and subline for
//    the utm_content variant before first paint, so hydration sees the text it will render;
//  - on any path other than "/" (privacy, terms) the script empties the root first, so the
//    home markup never flashes there.
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "vite";

// RW_NO_PRERENDER=1 skips the step, to measure a build with and without it (see DECISIONS.md B3).
if (process.env.RW_NO_PRERENDER === "1") {
  console.log("pre-render skipped (RW_NO_PRERENDER=1)");
  process.exit(0);
}

const dist = new URL("../dist/index.html", import.meta.url);
const html = readFileSync(dist, "utf8");
if (html.includes('data-prerendered="true"')) {
  console.log("already pre-rendered");
  process.exit(0);
}

const vite = await createServer({
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
try {
  const React = await import("react");
  const { renderToString } = await import("react-dom/server");
  const { App } = await vite.ssrLoadModule("/src/App.tsx");
  const { HEADLINES, DEFAULT_HEADLINE_ID } = await vite.ssrLoadModule("/src/copy/headlines.ts");
  const headline = HEADLINES[DEFAULT_HEADLINE_ID];
  const markup = renderToString(React.createElement(App, { headline, path: "/" }));

  const variants = Object.fromEntries(
    Object.values(HEADLINES).map((h) => [h.id, { h1: h.h1, sub: h.sub }]),
  );
  const script = `(function(){var r=document.getElementById("root");if(location.pathname!=="/"){r.innerHTML="";return}var k=(new URLSearchParams(location.search).get("utm_content")||"").trim().toLowerCase();var v=${JSON.stringify(variants)};if(k&&Object.prototype.hasOwnProperty.call(v,k)){var h=r.querySelector("h1"),s=r.querySelector(".hero .lead");if(h)h.textContent=v[k].h1;if(s)s.textContent=v[k].sub}})()`;

  const out = html.replace(
    '<div id="root"></div>',
    () => `<div id="root" data-prerendered="true">${markup}</div><script>${script}</script>`,
  );
  if (out === html) throw new Error('dist/index.html has no <div id="root"></div> to fill');
  writeFileSync(dist, out);
  console.log(`pre-rendered ${markup.length} bytes of markup`);
} finally {
  await vite.close();
}

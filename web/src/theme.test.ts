import { expect, test } from "vitest";
import html from "../index.html?raw";
import fontsCss from "./styles/fonts.css?raw";

const shipped = Object.keys(import.meta.glob("../public/fonts/*", { query: "?url" }));

test("every self-hosted font ships, swaps in, and the body face is preloaded", () => {
  const urls = [...fontsCss.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
  expect(urls).toHaveLength(3);
  for (const url of urls) expect(shipped).toContain(`../public${url}`);
  expect(fontsCss.match(/font-display: swap/g)).toHaveLength(urls.length);
  expect(shipped).toContain("../public/fonts/OFL.txt");
  expect(html).toMatch(/href="\/fonts\/ibm-plex-sans-latin\.woff2"\s+as="font"[^>]*crossorigin/);
});

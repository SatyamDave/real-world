import { expect, test } from "vitest";
import html from "../index.html?raw";
import fontsCss from "./styles/fonts.css?raw";
import lightCss from "./styles/tokens.css?raw";
import darkCss from "./styles/tokens-dark.css?raw";

const shipped = Object.keys(import.meta.glob("../public/fonts/*", { query: "?url" }));

test("every self-hosted font ships, swaps in, and the body face is preloaded", () => {
  const urls = [...fontsCss.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
  expect(urls).toHaveLength(3);
  for (const url of urls) expect(shipped).toContain(`../public${url}`);
  expect(fontsCss.match(/font-display: swap/g)).toHaveLength(urls.length);
  expect(shipped).toContain("../public/fonts/OFL.txt");
  expect(html).toMatch(/href="\/fonts\/ibm-plex-sans-latin\.woff2"\s+as="font"[^>]*crossorigin/);
});

const colors = (block: string) =>
  Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]),
  );

const light = colors(lightCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? "");
// The dark file holds the same block twice: under the system query and under data-theme="dark".
const darkBlocks = [...darkCss.matchAll(/(?::root[^{]*)\{([^{}]*--paper:[^{}]*)\}/g)].map((m) =>
  colors(m[1]),
);
const dark = darkBlocks[0];

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const ROLES = [
  "paper",
  "paper-2",
  "surface",
  "ink",
  "muted",
  "line",
  "line-strong",
  "accent",
  "accent-wash",
  "accent-2",
  "clay-wash",
  "focus",
  "on-accent",
];

test("both themes define every colour role, and the dark copies agree", () => {
  expect(darkBlocks).toHaveLength(2);
  expect(darkBlocks[1]).toEqual(dark);
  for (const role of ROLES) {
    expect(light[role], `light --${role}`).toBeDefined();
    expect(dark[role], `dark --${role}`).toBeDefined();
  }
  expect(lightCss).toMatch(/--radius:\s*4px/);
});

// Text pairs need 4.5:1 on every fill they sit on; the focus ring and the semantic colours as
// marks or borders need 3:1.
const TEXT: [string, string][] = [
  ["ink", "paper"],
  ["ink", "paper-2"],
  ["ink", "surface"],
  ["ink", "accent-wash"],
  ["muted", "paper"],
  ["muted", "paper-2"],
  ["muted", "surface"],
  ["muted", "accent-wash"],
  ["accent", "paper"],
  ["accent", "paper-2"],
  ["accent", "surface"],
  ["accent", "accent-wash"],
  ["accent-2", "paper"],
  ["accent-2", "paper-2"],
  ["accent-2", "surface"],
  ["accent-2", "clay-wash"],
  ["on-accent", "ink"],
];
const MARKS: [string, string][] = [
  ["focus", "paper"],
  ["focus", "surface"],
  ["accent-2", "clay-wash"],
];

for (const [name, theme] of [
  ["light", light],
  ["dark", dark],
] as const) {
  test(`${name} theme: text pairs reach 4.5:1 and marks 3:1`, () => {
    for (const [fg, bg] of TEXT)
      expect(contrast(theme[fg], theme[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    for (const [fg, bg] of MARKS)
      expect(contrast(theme[fg], theme[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
  });
}

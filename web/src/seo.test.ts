// @vitest-environment jsdom

import { build } from "vite";
import { expect, test } from "vitest";
import {
  applyMeta,
  canonicalUrl,
  descriptionFor,
  publicOrigin,
  ROUTES,
  robotsTxt,
  sitemapXml,
} from "./seo";

test("a production build needs a bare https origin; dev falls back to localhost", () => {
  expect(publicOrigin("https://rw.example/", true)).toBe("https://rw.example");
  for (const bad of [undefined, "", "rw.example", "http://rw.example", "https://rw.example/x"])
    expect(() => publicOrigin(bad, true)).toThrow(/VITE_PUBLIC_ORIGIN/);
  expect(publicOrigin(undefined, false)).toBe("http://localhost:5173");
  expect(publicOrigin("http://localhost:9000", false)).toBe("http://localhost:9000");
  expect(() => publicOrigin("ftp://x", false)).toThrow(/VITE_PUBLIC_ORIGIN/);
});

test("vite build in production mode fails without VITE_PUBLIC_ORIGIN", async () => {
  await expect(
    build({ mode: "production", logLevel: "silent", build: { write: false } }),
  ).rejects.toThrow(/VITE_PUBLIC_ORIGIN is required/);
});

test("sitemap and robots list the static routes at the origin, and no parameter route", () => {
  const xml = sitemapXml("https://rw.example");
  expect(xml.match(/<loc>[^<]+<\/loc>/g)).toEqual(
    ROUTES.map((r) => `<loc>${canonicalUrl("https://rw.example", r.path)}</loc>`),
  );
  expect(xml).toContain("<loc>https://rw.example/</loc>");
  expect(xml).not.toMatch(/record|sign-in|questions/);
  expect(robotsTxt("https://rw.example")).toContain("Sitemap: https://rw.example/sitemap.xml");
  for (const r of ROUTES) expect(r.description.length).toBeLessThan(160);
});

test("every route has a description; a parameter route shares one; an unknown path has none", () => {
  for (const r of ROUTES) expect(descriptionFor(r.path)).toBe(r.description);
  expect(descriptionFor("/how-it-works/")).toBe(descriptionFor("/how-it-works"));
  expect(descriptionFor("/questions/abc")).toMatch(/committed/);
  expect(descriptionFor("/questions/abc")).toBeDefined();
  expect(descriptionFor("/nope")).toBeUndefined();
  expect(descriptionFor("/simulate")).toMatch(/simulated consumers/);
  expect(descriptionFor("/playground")).toBeUndefined();
});

test("applyMeta follows the path and drops canonical on a path with no page", () => {
  document.head.innerHTML = "";
  applyMeta("https://rw.example", "/scores/");
  const get = (s: string) => document.head.querySelector(s);
  expect(get('link[rel="canonical"]')?.getAttribute("href")).toBe("https://rw.example/scores");
  expect(get('meta[property="og:url"]')?.getAttribute("content")).toBe("https://rw.example/scores");
  expect(get('meta[name="description"]')?.getAttribute("content")).toBe(descriptionFor("/scores"));
  applyMeta("https://rw.example", "/");
  expect(get('link[rel="canonical"]')?.getAttribute("href")).toBe("https://rw.example/");
  applyMeta("https://rw.example", "/nope");
  expect(get('link[rel="canonical"]')).toBeNull();
  expect(get('meta[property="og:url"]')).toBeNull();
});

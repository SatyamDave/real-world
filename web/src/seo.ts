// Share and search metadata (product/web-app.md, "Search and share metadata"). Pure except `applyMeta`;
// vite.config.ts imports it to check the origin and write robots.txt and sitemap.xml.

type Route = { path: string; description: string };

/** The routes with no parameter: the sitemap lists exactly these. */
export const ROUTES: Route[] = [
  {
    path: "/",
    description:
      "Test a launch message, a price change or a headline on simulated consumers before you ship it. AI-simulated.",
  },
  {
    path: "/simulate",
    description:
      "Test a message on simulated consumers, starting from a prepared decision. AI-simulated.",
  },
  {
    path: "/how-it-works",
    description:
      "How Real World tests a message on simulated consumers, and what the results are and are not. AI-simulated.",
  },
  {
    path: "/scores",
    description:
      "Scored in public: the simulation, a plain LLM and the market, with n and an interval.",
  },
  {
    path: "/receipts",
    description:
      "Every forecast, hashed before its outcome existed. Verify each hash in your browser.",
  },
  {
    path: "/acceptable-use",
    description: "What Real World refuses to test, and the refusal codes.",
  },
];

/** Routes that take a parameter: listed under their first path segment, never in the sitemap. */
const PARAM_DESCRIPTIONS: Record<string, string> = {
  questions:
    "One question's forecasts, committed before it resolved: the simulation, a plain LLM and the market side by side. AI-simulated.",
};

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path) || "/";

/** The description for a path, or undefined when no page lives there. */
export function descriptionFor(path: string): string | undefined {
  const p = normalize(path);
  return ROUTES.find((r) => r.path === p)?.description ?? PARAM_DESCRIPTIONS[p.split("/")[1] ?? ""];
}

export const DEV_ORIGIN = "http://localhost:5173";

/** The public origin with no trailing slash. A production build needs an https origin. */
export function publicOrigin(raw: string | undefined, production: boolean): string {
  if (!raw) {
    if (production) throw new Error("VITE_PUBLIC_ORIGIN is required for a production build");
    return DEV_ORIGIN;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`VITE_PUBLIC_ORIGIN is not a URL: ${raw}`);
  }
  const bare = url.pathname === "/" && !url.search && !url.hash && !url.username;
  if (!bare || (production ? url.protocol !== "https:" : !/^https?:$/.test(url.protocol)))
    throw new Error(
      `VITE_PUBLIC_ORIGIN must be ${production ? "an https" : "an http(s)"} origin with no path, got ${raw}`,
    );
  return url.origin;
}

export const canonicalUrl = (origin: string, path: string) =>
  `${origin}${normalize(path) === "/" ? "/" : normalize(path)}`;

export const robotsTxt = (origin: string) =>
  `User-agent: *\nAllow: /\nDisallow: /record\nDisallow: /sign-in\n\nSitemap: ${origin}/sitemap.xml\n`;

export const sitemapXml = (origin: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROUTES.map(
    (r) => `  <url><loc>${canonicalUrl(origin, r.path)}</loc></url>\n`,
  ).join("")}</urlset>\n`;

function put(
  selector: string,
  tag: string,
  [key, id]: [string, string],
  attr: string,
  value: string,
) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(key, id);
    document.head.append(el);
  }
  el.setAttribute(attr, value);
}

/** Points canonical, og:url and the description at `path`; a path with no page loses all three. */
export function applyMeta(origin: string, path: string) {
  const description = descriptionFor(path);
  if (description === undefined) {
    for (const s of ['link[rel="canonical"]', 'meta[property="og:url"]'])
      document.head.querySelector(s)?.remove();
    return;
  }
  const url = canonicalUrl(origin, path);
  put('link[rel="canonical"]', "link", ["rel", "canonical"], "href", url);
  put('meta[property="og:url"]', "meta", ["property", "og:url"], "content", url);
  put('meta[name="description"]', "meta", ["name", "description"], "content", description);
}

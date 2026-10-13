import { ApiError } from "@real-world/sdk";
import { type ComponentType, lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import { AcceptableUse } from "./AcceptableUse";
import { rw } from "./api";
import { Home } from "./Home";
import { ReceiptsPage } from "./Receipts";
import { applyMeta } from "./seo";
import { signInHref, useSession } from "./session";

// A file in pages/ is a route: `/<name>` and `/<name>/<param>`. Its default export is the page, and
// its named export `title` is the document title, read once the module loads.
type PageModule = { default: ComponentType<{ param?: string }>; title: string };
const PAGES: Record<string, ComponentType<{ param?: string }>> = Object.fromEntries(
  Object.entries(import.meta.glob("./pages/*.tsx")).map(([file, load]) => [
    file.slice("./pages/".length, -".tsx".length),
    lazy(async () => {
      const m = (await load()) as PageModule;
      document.title = `${m.title} · Real World`;
      return { default: m.default };
    }),
  ]),
);
const NAV = [
  ["Simulate", "/simulate"],
  ["Your tests", "/record"],
  ["How it works", "/how-it-works"],
  ["Public record", "/receipts"],
] as const;

export const DISCLOSURE = "AI-simulated. Not a poll or a prediction of a real person";

/** The one display name for each forecaster, on every screen. */
export const FORECASTER = { sim: "Simulation", plain_llm: "Plain LLM", market: "Market" } as const;

/** An API error's `detail` sentence (or `fallback`) as a status line with one full stop. */
export function failure(e: unknown, fallback: string): string {
  const body = e instanceof ApiError ? (e.body as { detail?: unknown } | null) : null;
  const detail = typeof body?.detail === "string" && body.detail ? body.detail : fallback;
  return `${detail.trim().replace(/\.+$/, "")}.`;
}

export const pct = (share: number) => `${Math.round(share * 100)}%`;

export const pts = (delta: number) =>
  `${delta >= 0 ? "+" : "−"}${Math.abs(delta * 100).toFixed(1)} pts`;

export const usd = (v: number) => (v < 0.005 ? "under 1 cent" : `$${v.toFixed(2)}`);

export const topicLabel = (topic: string) =>
  topic.charAt(0).toUpperCase() + topic.slice(1).replaceAll("_", " ");

/** A label as the start of a sentence: its first character upper-cased. */
export const sentence = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const plural = (n: number, word: string) =>
  `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Loads once per distinct `key`, and again on `retry`; `load` is read only then. */
export function useLoad<T>(load: () => Promise<T>, key = "") {
  const [state, setState] = useState<{ data?: T; error?: Error }>({});
  const [attempt, setAttempt] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key and attempt name everything load reads
  useEffect(() => {
    let live = true;
    setState({});
    load().then(
      (data) => live && setState({ data }),
      (error: Error) => live && setState({ error }),
    );
    return () => {
      live = false;
    };
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`tier tier-${tier}`} title={`Coverage tier ${tier}`}>
      <span className="sr-only">Coverage tier </span>
      {tier}
    </span>
  );
}

export function Disclosure({ tiers }: { tiers: string[] }) {
  const counts = ["A", "B", "C", "D"]
    .map((t) => [t, tiers.filter((x) => x === t).length] as const)
    .filter(([, n]) => n > 0);
  return (
    <p className="disclosure">
      {DISCLOSURE}
      {counts.length > 0 && (
        <>
          {". Coverage "}
          {counts.map(([t, n]) => (
            <span key={t} className="disclosure-tier">
              <TierBadge tier={t} />×{n}
            </span>
          ))}
        </>
      )}
    </p>
  );
}

export function Loading({ what }: { what: string }) {
  return (
    <p className="muted small loading" role="status">
      <span className="spinner" aria-hidden="true" />
      Loading {what}
    </p>
  );
}

/** A failed call in words, never the raw response body, with a way to try again. */
export function LoadError({
  what,
  error,
  retry,
}: {
  what: string;
  error: Error;
  retry?: () => void;
}) {
  const why =
    error instanceof ApiError
      ? error.status === 404
        ? "It was not found."
        : error.status >= 500
          ? "The server had an error."
          : "The server refused the request."
      : "The server did not respond.";
  return (
    <p className="muted small load-error" role="alert">
      Could not load {what}. {why}{" "}
      {retry && (
        <button type="button" className="link" onClick={retry}>
          Try again
        </button>
      )}
    </p>
  );
}

function Header({ path }: { path: string }) {
  const section = `/${path.split("/")[1]}`;
  const session = useSession();
  return (
    <header className="topbar">
      <a href="#main" className="skip">
        Skip to content
      </a>
      <a href="/" className="brand">
        Real World
        <span className="brand-mark" aria-hidden="true">
          .
        </span>
      </a>
      <nav aria-label="Pages">
        {NAV.map(([label, href]) => (
          <a key={href} href={href} aria-current={href === section ? "page" : undefined}>
            {label}
          </a>
        ))}
      </nav>
      {session.data ? (
        <a href="/record" className="account">
          {session.data.email}
        </a>
      ) : session.data === null ? (
        <a href={signInHref()} className="account">
          Sign in
        </a>
      ) : null}
    </header>
  );
}

/** A SHA-256 drawn as 64 cells, one per hex digit, in four shades; empty and dashed when there is no hash. */
export function SealGrid({ hash, large = false }: { hash?: string | null; large?: boolean }) {
  const cells = hash
    ? [...hash.slice(0, 64)].map((h) => Number.parseInt(h, 16) >> 2)
    : Array<null>(64).fill(null);
  return (
    <span
      className={`seal-grid${large ? " lg" : ""}${hash ? "" : " empty"}`}
      role="img"
      aria-label={hash ? `Seal ${hash.slice(0, 12)}` : "Not sealed"}
    >
      {cells.map((v, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed 64-cell drawing
        <span key={i} className={v === null ? "" : `s${v}`} />
      ))}
    </span>
  );
}

export const ANCHOR: Record<string, string> = {
  anchored: "anchored",
  pending: "anchor pending",
  not_anchored: "not anchored",
};

/** A seal drawn beside two lines: what is sealed, then the hash and where to check it. */
export function SealRow({
  hash,
  title,
  children,
}: {
  hash?: string | null;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="seal-row">
      <SealGrid hash={hash} large />
      <div>
        <p className="seal-row-title">{title}</p>
        {children && <div className="mono seal-row-meta">{children}</div>}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <section className="card notfound">
      <h1>Page not found</h1>
      <p className="muted">
        No page at this address. <a href="/">Go home</a>
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <nav aria-label="Footer">
        <a href="/receipts">Public record</a>
        <a href="/acceptable-use">Acceptable use</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="https://github.com/SatyamDave/real-world">Source</a>
      </nav>
      <p>
        Real World outputs are AI-simulated. Simulated populations are not polls and not predictions
        about real people.
      </p>
      <p>© 2026 Real World.</p>
    </footer>
  );
}

const TITLES: Record<string, string> = {
  "/": "Test your message before you ship it · Real World",
  "/receipts": "Receipts · Real World",
  "/acceptable-use": "Acceptable use · Real World",
};

export function App({ path = location.pathname }: { path?: string }) {
  const { data: w, error, retry } = useLoad(() => rw.world());
  const tiers = w?.countries.map((c) => c.tier) ?? [];
  const page = path.match(/^\/([^/]+)(?:\/([^/]+))?\/?$/);
  const Page = page && Object.hasOwn(PAGES, page[1]) ? PAGES[page[1]] : undefined;
  const known = path in TITLES || Page !== undefined;
  useEffect(() => {
    if (!Page) document.title = TITLES[path] ?? "Page not found · Real World";
  }, [path, Page]);
  useEffect(() => applyMeta(import.meta.env.VITE_PUBLIC_ORIGIN ?? location.origin, path), [path]);
  return (
    <div className="site">
      <Header path={path} />
      <main id="main" tabIndex={-1} className="page">
        {error && known && <LoadError what="today's world" error={error} retry={retry} />}
        {path === "/receipts" ? (
          <ReceiptsPage tiers={tiers} />
        ) : path === "/acceptable-use" ? (
          <AcceptableUse />
        ) : path === "/" ? (
          <Home />
        ) : Page && page ? (
          <Suspense fallback={<Loading what="the page" />}>
            <Page param={page[2] === undefined ? undefined : decodeURIComponent(page[2])} />
          </Suspense>
        ) : (
          <NotFound />
        )}
      </main>
      <Footer />
    </div>
  );
}

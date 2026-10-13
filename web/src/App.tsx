import { ApiError, type Country, type SystemStatus, type World } from "@real-world/sdk";
import { type ComponentType, lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import { AcceptableUse } from "./AcceptableUse";
import { AgentPanel } from "./AgentPanel";
import { rw } from "./api";
import { DailyQuestion } from "./DailyQuestion";
import { Fork, ForkRun } from "./ForkCard";
import { ReceiptsPage, ReceiptsStrip } from "./Receipts";
import { applyMeta } from "./seo";
import { applyTheme, storedTheme, type Theme } from "./theme";

// three.js is most of the bundle, so the globe loads once the page is idle, and only on screens
// wide enough to use it. A still poster holds its place until then, and is all a phone shows.
const Globe = lazy(() => import("./Globe"));
// The docs page carries api/openapi.json, so it loads only on /docs.
const Docs = lazy(() => import("./Docs").then((m) => ({ default: m.Docs })));
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
  ["Today", "/"],
  ["World", "/world"],
  ["Cycle", "/cycle"],
  ["Scores", "/scores"],
  ["Receipts", "/receipts"],
  ["Research", "/research"],
  ["API", "/docs"],
] as const;
const WIDE = "(min-width: 768px)";
const FEATURED = ["USA", "BRA", "KEN"];

export const DISCLOSURE = "AI-simulated. Not a poll or a prediction of a real person";

/** The one display name for each forecaster, on every screen. */
export const FORECASTER = { sim: "Simulation", plain_llm: "Plain LLM", market: "Market" } as const;

/** An API error's `detail` sentence (or `fallback`) as a status line with one full stop. */
export function failure(e: unknown, fallback: string): string {
  const body = e instanceof ApiError ? (e.body as { detail?: unknown } | null) : null;
  const detail = typeof body?.detail === "string" && body.detail ? body.detail : fallback;
  return `${detail.trim().replace(/\.+$/, "")}.`;
}

export const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Runs `run` once the page has loaded and the main thread is idle; returns a cancel. */
export function whenIdle(run: () => void): () => void {
  let cancel = () => {};
  const idle = () => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 2000 });
      cancel = () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(run, 200);
      cancel = () => clearTimeout(id);
    }
  };
  if (document.readyState === "complete") idle();
  else {
    addEventListener("load", idle, { once: true });
    cancel = () => removeEventListener("load", idle);
  }
  return () => cancel();
}

export const pct = (share: number) => `${Math.round(share * 100)}%`;

export const pts = (delta: number) =>
  `${delta >= 0 ? "+" : "−"}${Math.abs(delta * 100).toFixed(1)} pts`;

export const usd = (v: number) => (v < 0.005 ? "under 1 cent" : `$${v.toFixed(2)}`);

export const topicLabel = (topic: string) =>
  topic.charAt(0).toUpperCase() + topic.slice(1).replaceAll("_", " ");

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

export type Shape = "lines" | "rows" | "card";
const SKELETON_ROWS: Record<Shape, number> = { lines: 3, rows: 5, card: 1 };

/** True once `ms` has passed since mount, so a fast load shows no placeholder at all. */
function useAfter(ms: number) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return done;
}

/**
 * The loading state: a skeleton in the result's `shape`, drawn only after 200ms, with a polite
 * status line for screen readers. `progress` is real progress text (a fork's day count) and shows.
 */
export function Loading({
  what,
  shape = "lines",
  progress = false,
}: {
  what: string;
  shape?: Shape;
  progress?: boolean;
}) {
  const late = useAfter(200);
  return (
    <div className={`state state-${shape}`} role="status" aria-live="polite">
      <span className={progress ? "muted small" : "sr-only"}>Loading {what}</span>
      {late &&
        Array.from({ length: SKELETON_ROWS[shape] }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: identical placeholder rows
          <span key={i} className="skeleton" aria-hidden="true" />
        ))}
    </div>
  );
}

/** A failed call in words, never the raw response body, with a way to try again. */
export function LoadError({
  what,
  error,
  retry,
  shape = "lines",
}: {
  what: string;
  error: Error;
  retry?: () => void;
  shape?: Shape;
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
    <div className={`state state-${shape} load-error`} role="alert">
      <p>
        Could not load {what}. {why}
      </p>
      {retry && (
        <button type="button" className="link" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Nothing yet: one sentence saying when there will be, and at most one next action. */
export function Empty({
  children,
  action,
}: {
  children: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="empty">
      <p className="muted">{children}</p>
      {action && (
        <a className="button" href={action.href}>
          {action.label}
        </a>
      )}
    </div>
  );
}

/** The API's own refusal sentence, as sent, in a clay callout with the one link that helps. */
export function Refused({
  children,
  help,
}: {
  children: ReactNode;
  help?: { label: string; href: string };
}) {
  return (
    <p className="callout callout-refused" role="alert">
      {children} {help && <a href={help.href}>{help.label}</a>}
    </p>
  );
}

function useWide() {
  const [query] = useState(() => (typeof matchMedia === "function" ? matchMedia(WIDE) : null));
  const [wide, setWide] = useState(query?.matches ?? false);
  useEffect(() => {
    if (!query) return;
    const on = () => setWide(query.matches);
    query.addEventListener("change", on);
    return () => query.removeEventListener("change", on);
  }, [query]);
  return wide;
}

function Header({ path, date }: { path: string; date?: string }) {
  // /cycle/2026-10-05 highlights Cycle; a path with no nav item highlights nothing
  const section = `/${path.split("/")[1]}`;
  return (
    <header className="topbar">
      <a href="#main" className="skip">
        Skip to content
      </a>
      <a href="/" className="brand">
        <span>
          Real World
          <span className="brand-mark" aria-hidden="true">
            .
          </span>
          <span className="brand-date">{date ? `World of ${shortDate(date)}` : " "}</span>
        </span>
      </a>
      <nav aria-label="Pages">
        {NAV.map(([label, href]) => (
          <a key={href} href={href} aria-current={href === section ? "page" : undefined}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}

/** The claim the page rests on, with the record as its proof. Copy follows gtm/messaging.md. */
function Thesis() {
  const r = useLoad(() => rw.receipts());
  const days = r.data?.days ?? [];
  const first = days.at(-1)?.date;
  const leaves = days.reduce((n, d) => n + Number(d.leaf_count), 0);
  return (
    <section className="thesis" aria-labelledby="thesis">
      <h1 id="thesis">Simulations with receipts.</h1>
      <p>
        AI simulates how the world reacts to the news. Every forecast is sealed before the outcome
        and scored in public.
      </p>
      {r.error ? (
        <LoadError what="the record" error={r.error} retry={r.retry} />
      ) : !r.data ? (
        <Loading what="the record" />
      ) : first ? (
        <p className="proof">
          Scored in public since {shortDate(first)}: {plural(days.length, "day")},{" "}
          {plural(leaves, "receipt")}. <a href="/receipts">Verify every hash</a>
        </p>
      ) : (
        <p className="proof">No forecast is hashed yet. The record starts with the first one.</p>
      )}
    </section>
  );
}

function AgentLinks({
  countries,
  onSelect,
}: {
  countries: Country[];
  onSelect: (c: Country) => void;
}) {
  const picks = FEATURED.map((iso) => countries.find((c) => c.iso3 === iso)).filter(
    (c): c is Country => c !== undefined,
  );
  if (!picks.length) return null;
  return (
    <p className="agent-links">
      Read one agent:{" "}
      {picks.map((c, i) => (
        <span key={c.iso3}>
          {i > 0 && ", "}
          <button type="button" className="link" onClick={() => onSelect(c)}>
            {c.name}
          </button>
        </span>
      ))}
    </p>
  );
}

/** The phone and keyboard alternative to the globe: every simulated country with its tier. */
function CountryList({
  countries,
  onSelect,
}: {
  countries: Country[];
  onSelect: (c: Country) => void;
}) {
  return (
    <section className="card countries">
      <h2>Read one agent</h2>
      <p className="muted small">Pick a country to open one sampled agent and what moved it.</p>
      <ul>
        {countries.map((c) => (
          <li key={c.iso3}>
            <button type="button" onClick={() => onSelect(c)}>
              <span>{c.name}</span>
              <TierBadge tier={c.tier} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function useIdle() {
  const [idle, setIdle] = useState(false);
  useEffect(() => whenIdle(() => setIdle(true)), []);
  return idle;
}

function Home({ w, tiers, alert }: { w?: World; tiers: string[]; alert?: ReactNode }) {
  const [selected, setSelected] = useState<Country | null>(null);
  const wide = useWide();
  const idle = useIdle();
  return (
    <>
      <div className="home">
        {alert}
        <Thesis />
        <DailyQuestion tiers={tiers} />
        {w && wide && <AgentLinks countries={w.countries} onSelect={setSelected} />}
        <ReceiptsStrip />
        {w && <Fork events={w.prefilled_events} />}
        {w && !wide && <CountryList countries={w.countries} onSelect={setSelected} />}
      </div>
      <div className="globe">
        <img
          className="globe-poster"
          src="/globe-poster.svg"
          width={500}
          height={500}
          alt="A dot-sampled globe of the world's land."
        />
        {w && wide && idle && (
          <Suspense fallback={null}>
            <Globe countries={w.countries} onSelect={setSelected} paused={selected !== null} />
          </Suspense>
        )}
      </div>
      {selected && <AgentPanel country={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

export function NotFound() {
  return (
    <section className="card notfound">
      <h1>Page not found</h1>
      <p className="muted">
        No page at this address. <a href="/">Go to today's question</a>
      </p>
    </section>
  );
}

const SPENT_NOTHING = "fake (nothing spent)";
const head = (hash: string) => `${hash.slice(0, 4)}…${hash.slice(-4)}`;

/** One mono line from GET /v1/status: the cycle, the ledger head, the model and today's spend. */
export function statusLine(s: SystemStatus): string {
  if (!s.date) return "No cycle has run yet";
  const fake = s.provider === "fake";
  const anchor =
    s.anchor === "anchored" ? `anchored ${s.anchored_at}` : (s.anchor ?? "").replace("_", " ");
  return [
    `Last cycle ${s.date} ${s.cycle_status.replace("_", " ")}`,
    `ledger head ${s.record_hash ? head(s.record_hash) : "none"}`,
    `anchor: ${anchor || "none"}`,
    `model: ${fake ? SPENT_NOTHING : s.model}`,
    `spend today $${(fake ? 0 : s.spent_today_usd).toFixed(2)} of $${s.nightly_budget_usd.toFixed(2)}`,
  ].join(" · ");
}

function StatusStrip() {
  const r = useLoad(() => rw.status());
  return r.error ? (
    <LoadError what="system status" error={r.error} retry={r.retry} />
  ) : !r.data ? (
    <Loading what="system status" />
  ) : (
    <p className="status-strip" role="status">
      {statusLine(r.data)}
    </p>
  );
}

const NEXT_THEME: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

function ThemeToggle() {
  const [theme, setTheme] = useState(storedTheme);
  return (
    <button
      type="button"
      className="link"
      onClick={() => {
        applyTheme(NEXT_THEME[theme], true);
        setTheme(NEXT_THEME[theme]);
      }}
    >
      Theme: {theme}
    </button>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <StatusStrip />
      <nav aria-label="Footer">
        <a href="/receipts">Receipts</a>
        <a href="/acceptable-use">Acceptable use</a>
        <a href="/docs">API</a>
        <a href="https://github.com/SatyamDave/real-world">Source</a>
        <ThemeToggle />
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
  "/": "Simulations with receipts. · Real World",
  "/receipts": "Receipts · Real World",
  "/acceptable-use": "Acceptable use · Real World",
  "/docs": "API · Real World",
};

export function App({ path = location.pathname }: { path?: string }) {
  const { data: w, error, retry } = useLoad(() => rw.world());
  const tiers = w?.countries.map((c) => c.tier) ?? [];
  const fork = path.match(/^\/fork\/([^/]+)$/);
  const page = path.match(/^\/([^/]+)(?:\/([^/]+))?\/?$/);
  const Page = page && Object.hasOwn(PAGES, page[1]) ? PAGES[page[1]] : undefined;
  const known = fork !== null || path in TITLES || Page !== undefined;
  const worldError = error && known && (
    <LoadError what="today's world" error={error} retry={retry} />
  );
  // A fork names itself once its event text has loaded.
  useEffect(() => {
    if (!path.startsWith("/fork/") && !Page)
      document.title = TITLES[path] ?? "Page not found · Real World";
  }, [path, Page]);
  useEffect(() => applyMeta(import.meta.env.VITE_PUBLIC_ORIGIN ?? location.origin, path), [path]);
  return (
    <>
      <Header path={path} date={w?.date} />
      <main id="main" tabIndex={-1} className={path === "/" ? undefined : "page"}>
        {path !== "/" && worldError}
        {fork ? (
          <ForkRun id={decodeURIComponent(fork[1])} />
        ) : path === "/receipts" ? (
          <ReceiptsPage tiers={tiers} />
        ) : path === "/docs" ? (
          <Suspense fallback={<Loading what="the API" shape="rows" />}>
            <Docs />
          </Suspense>
        ) : path === "/acceptable-use" ? (
          <AcceptableUse />
        ) : path === "/" ? (
          <Home w={w} tiers={tiers} alert={worldError} />
        ) : Page && page ? (
          <Suspense fallback={<Loading what="the page" shape="rows" />}>
            <Page param={page[2] === undefined ? undefined : decodeURIComponent(page[2])} />
          </Suspense>
        ) : (
          <NotFound />
        )}
      </main>
      <Footer />
    </>
  );
}

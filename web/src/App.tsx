import { ApiError, type Country, type World } from "@real-world/sdk";
import { lazy, Suspense, useEffect, useState } from "react";
import { AgentPanel } from "./AgentPanel";
import { rw } from "./api";
import { DailyQuestion } from "./DailyQuestion";
import { Fork, ForkRun } from "./ForkCard";
import { ReceiptsPage, ReceiptsStrip } from "./Receipts";

// three.js is most of the bundle, so the globe loads once the page is idle, and only on screens
// wide enough to use it. A still poster holds its place until then, and is all a phone shows.
const Globe = lazy(() => import("./Globe"));
const WIDE = "(min-width: 768px)";
const FEATURED = ["USA", "BRA", "KEN"];

export const DISCLOSURE = "AI-simulated. Not a poll or a prediction of a real person";

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
              <TierBadge tier={t} />
              {n > 1 && `×${n}`}
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
        <a href="/" aria-current={path === "/" ? "page" : undefined}>
          Today
        </a>
        <a href="/receipts" aria-current={path === "/receipts" ? "page" : undefined}>
          Receipts
        </a>
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
      <h1 id="thesis">Don't ask a model. Ask a world.</h1>
      <p>
        Every morning a simulated population reacts to the day's news. Its forecasts are hashed
        before anything resolves and scored in public against the markets, misses included.
      </p>
      {r.error ? (
        <LoadError what="the record" error={r.error} retry={r.retry} />
      ) : !r.data ? (
        <Loading what="the record" />
      ) : first ? (
        <p className="proof">
          Scored in public since {shortDate(first)}: {plural(days.length, "day")},{" "}
          {plural(leaves, "receipt")}. <a href="/receipts">Check every hash</a>
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

function Home({ w, tiers }: { w?: World; tiers: string[] }) {
  const [selected, setSelected] = useState<Country | null>(null);
  const wide = useWide();
  const idle = useIdle();
  return (
    <>
      <div className="home">
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

function NotFound() {
  return (
    <section className="card notfound">
      <h1>Page not found</h1>
      <p className="muted">
        Nothing lives at this address. <a href="/">Go to today's question</a>
      </p>
    </section>
  );
}

const TITLES: Record<string, string> = {
  "/": "Real World: don't ask a model, ask a world",
  "/receipts": "Receipts · Real World",
};

export function App({ path = location.pathname }: { path?: string }) {
  const { data: w, error, retry } = useLoad(() => rw.world());
  const tiers = w?.countries.map((c) => c.tier) ?? [];
  const fork = path.match(/^\/fork\/([^/]+)$/);
  const known = fork !== null || path in TITLES;
  // A fork names itself once its event text has loaded.
  useEffect(() => {
    if (!path.startsWith("/fork/")) document.title = TITLES[path] ?? "Page not found · Real World";
  }, [path]);
  return (
    <>
      <Header path={path} date={w?.date} />
      <main id="main" tabIndex={-1} className={path === "/" ? undefined : "page"}>
        {error && known && <LoadError what="today's world" error={error} retry={retry} />}
        {fork ? (
          <ForkRun id={decodeURIComponent(fork[1])} />
        ) : path === "/receipts" ? (
          <ReceiptsPage tiers={tiers} />
        ) : path === "/" ? (
          <Home w={w} tiers={tiers} />
        ) : (
          <NotFound />
        )}
      </main>
    </>
  );
}

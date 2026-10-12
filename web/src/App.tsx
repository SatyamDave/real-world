import { lazy, Suspense, useEffect, useState } from "react";
import { AgentPanel } from "./AgentPanel";
import { type Country, type Tier, type World, world } from "./api";
import { DailyQuestion } from "./DailyQuestion";
import { Fork, ForkRun } from "./ForkCard";
import { ReceiptsPage, ReceiptsStrip } from "./Receipts";

// three.js is most of the bundle, so the globe loads after the question is on screen.
const Globe = lazy(() => import("./Globe"));

export const DISCLOSURE = "Simulation, not a poll or a prediction of a real person";

export const pct = (share: number) => `${Math.round(share * 100)}%`;

export const pts = (delta: number) =>
  `${delta >= 0 ? "+" : "−"}${Math.abs(delta * 100).toFixed(1)} pts`;

export const topicLabel = (topic: string) =>
  topic.charAt(0).toUpperCase() + topic.slice(1).replaceAll("_", " ");

/** Loads once per distinct `key`; `load` is read only when the key changes. */
export function useLoad<T>(load: () => Promise<T>, key = "") {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  // biome-ignore lint/correctness/useExhaustiveDependencies: key names everything load reads
  useEffect(() => {
    let live = true;
    setState({});
    load().then(
      (data) => live && setState({ data }),
      (e: Error) => live && setState({ error: e.message }),
    );
    return () => {
      live = false;
    };
  }, [key]);
  return state;
}

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`tier tier-${tier}`} title={`Coverage tier ${tier}`}>
      {tier}
    </span>
  );
}

export function Disclosure({ tiers }: { tiers: Tier[] }) {
  const counts = (["A", "B", "C", "D"] as Tier[])
    .map((t) => [t, tiers.filter((x) => x === t).length] as const)
    .filter(([, n]) => n > 0);
  return (
    <p className="disclosure">
      {DISCLOSURE}
      {counts.length > 0 && (
        <>
          {" · Coverage "}
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

export function LoadError({ what, error }: { what: string; error: string }) {
  return (
    <p className="muted">
      Could not load {what}: {error}
    </p>
  );
}

function Header({ path }: { path: string }) {
  return (
    <header className="topbar">
      <a href="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        Real World
      </a>
      <nav>
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

function Home({ w, tiers }: { w?: World; tiers: Tier[] }) {
  const [selected, setSelected] = useState<Country | null>(null);
  return (
    <>
      <div className="home">
        <DailyQuestion tiers={tiers} />
        <ReceiptsStrip />
        {w && <Fork events={w.prefilled_events} />}
      </div>
      {w && (
        <Suspense fallback={<div className="globe" />}>
          <Globe countries={w.countries} onSelect={setSelected} paused={selected !== null} />
        </Suspense>
      )}
      {selected && <AgentPanel country={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

export function App({ path = location.pathname }: { path?: string }) {
  const { data: w, error } = useLoad(world);
  const tiers = w?.countries.map((c) => c.tier) ?? [];
  const fork = path.match(/^\/fork\/([^/]+)$/);
  return (
    <>
      <Header path={path} />
      <main className={fork || path === "/receipts" ? "page" : undefined}>
        {error && <LoadError what="today's world" error={error} />}
        {fork ? (
          <ForkRun id={decodeURIComponent(fork[1])} />
        ) : path === "/receipts" ? (
          <ReceiptsPage tiers={tiers} />
        ) : (
          <Home w={w} tiers={tiers} />
        )}
      </main>
    </>
  );
}

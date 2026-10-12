import { ApiError, type Reveal } from "@real-world/sdk";
import { type CSSProperties, useState } from "react";
import { Disclosure, LoadError, pct, useLoad } from "./App";
import { rw } from "./api";

const PLAYER_KEY = "rw.player_id";

// Storage can throw (private mode, blocked site data); a fresh id then lasts for this page only.
function playerId(): string {
  try {
    const saved = localStorage.getItem(PLAYER_KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(PLAYER_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function DailyQuestion({ tiers }: { tiers: string[] }) {
  const [player] = useState(playerId);
  const loaded = useLoad(() => rw.daily(player), player);
  const [value, setValue] = useState(50);
  const [after, setAfter] = useState<Reveal | null>(null);
  const [status, setStatus] = useState("");

  if (loaded.error) return <LoadError what="today's question" error={loaded.error} />;
  const q = loaded.data?.question;
  const reveal = after ?? loaded.data?.reveal;
  if (!q) return <section className="card daily skeleton" aria-busy="true" />;

  async function submit() {
    if (!q) return;
    setStatus("Submitting");
    try {
      setAfter((await rw.answer_daily(q.id, player, value / 100)).reveal);
      setStatus("");
    } catch (e) {
      // 409 means this browser already answered; its reveal still applies.
      if (!(e instanceof ApiError && e.status === 409)) {
        setStatus(`Not submitted: ${(e as Error).message}`);
        return;
      }
      try {
        setAfter((await rw.daily(player)).reveal);
        setStatus("");
      } catch (e) {
        setStatus(`Submitted. The reveal did not load: ${(e as Error).message}`);
      }
    }
  }

  return (
    <section className="card daily">
      <p className="eyebrow">
        Today's question <span className="dot" /> resolves by {day(q.resolves_by)}
      </p>
      <h1 className="question">{q.text}</h1>
      <p className="muted small">
        Resolution source:{" "}
        <a href={q.resolution_source} target="_blank" rel="noreferrer">
          {q.resolution_source}
        </a>
      </p>
      {reveal ? (
        <RevealView reveal={reveal} tiers={tiers} />
      ) : (
        <form
          className="answer"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="slider">
            <span className="slider-value">{value}%</span>
            <span className="sr-only">Your probability that the answer is yes</span>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              style={{ "--fill": `${value}%` } as CSSProperties}
            />
            <span className="slider-ends" aria-hidden="true">
              <span>No</span>
              <span>Yes</span>
            </span>
          </label>
          <button type="submit" className="primary" disabled={status === "Submitting"}>
            Submit {value}%
          </button>
          {status && status !== "Submitting" && <p className="muted small">{status}</p>}
        </form>
      )}
    </section>
  );
}

function RevealView({ reveal, tiers }: { reveal: Reveal; tiers: string[] }) {
  const rows: [string, number | null, string][] = [
    ["You", reveal.you, "your answer"],
    [
      "Visitors",
      reveal.crowd.mean,
      `${reveal.crowd.count.toLocaleString()} self-selected visitors`,
    ],
    ["Simulated world", reveal.sim, "committed forecast"],
    ["Market", reveal.market, reveal.market === null ? "no market price" : "price at commit"],
  ];
  return (
    <div className="reveal" aria-live="polite">
      <div className="reveal-grid">
        {rows.map(([name, v, sub], i) => (
          <div key={name} className={`stat stat-${i}`}>
            <span className="stat-name">{name}</span>
            <span className="stat-value">{v === null ? "—" : pct(v)}</span>
            <span className="stat-sub">{sub}</span>
          </div>
        ))}
      </div>
      <div className="scale" aria-hidden="true">
        {rows.map(([name, v], i) =>
          v === null ? null : (
            <span key={name} className={`marker stat-${i}`} style={{ left: pct(v) }} />
          ),
        )}
      </div>
      <p className="streak">
        <strong>{reveal.streak}</strong> {reveal.streak === 1 ? "day" : "days"} answered in a row
      </p>
      {reveal.outcome !== null && reveal.brier !== null && (
        <p className="small">
          Resolved {reveal.outcome ? "yes" : "no"}. Your Brier score: {reveal.brier.toFixed(3)}{" "}
          (lower is better; a constant 50% scores 0.25).
        </p>
      )}
      <Disclosure tiers={tiers} />
    </div>
  );
}

import { ApiError, type Reveal } from "@real-world/sdk";
import { type CSSProperties, useState } from "react";
import {
  Disclosure,
  FORECASTER,
  failure,
  LoadError,
  Loading,
  pct,
  plural,
  shortDate,
  useLoad,
} from "./App";
import { rw } from "./api";
import { SQUARES, square, weekShareText } from "./share";

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

const host = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

export function DailyQuestion({ tiers }: { tiers: string[] }) {
  const [player] = useState(playerId);
  const loaded = useLoad(() => rw.daily(player), player);
  const [value, setValue] = useState(50);
  const [after, setAfter] = useState<Reveal | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (loaded.error)
    return (
      <section className="card daily">
        <LoadError what="today's question" error={loaded.error} retry={loaded.retry} />
      </section>
    );
  const q = loaded.data?.question;
  const reveal = after ?? loaded.data?.reveal;
  if (!q || !loaded.data)
    return (
      <section className="card daily skeleton" aria-busy="true">
        <Loading what="today's question" />
      </section>
    );
  const date = loaded.data.date;
  const closed = Date.now() >= Date.parse(q.closes_at);

  async function submit() {
    if (!q) return;
    setBusy(true);
    setStatus("");
    try {
      setAfter((await rw.answer_daily(q.id, player, value / 100)).reveal);
    } catch (e) {
      // 409 means this browser already answered, and its reveal applies, or answers closed.
      if (!(e instanceof ApiError && e.status === 409)) {
        setStatus(failure(e, "The server did not accept the answer"));
      } else {
        try {
          const reveal = (await rw.daily(player)).reveal;
          setAfter(reveal);
          if (!reveal) setStatus(failure(e, "Answers for this question are closed"));
        } catch {
          setStatus("Submitted. The reveal did not load. Reload the page to see it.");
        }
      }
    }
    setBusy(false);
  }

  return (
    <section className="card receipt daily">
      <div className="receipt-top">
        <span>Today's question</span>
        {reveal?.outcome != null ? (
          <span className="stamp good">Resolved {reveal.outcome ? "yes" : "no"}</span>
        ) : (
          <span className="stamp">Pending</span>
        )}
      </div>
      <h2 className="question">{q.text}</h2>
      <dl className="receipt-cols">
        <div>
          <dt>Committed</dt>
          {reveal?.sim != null ? (
            <dd>
              <a href={`/receipts#${date}`}>{date}</a>
              <span className="src">in that day's record</span>
            </dd>
          ) : reveal ? (
            <dd className="pending">No forecast committed</dd>
          ) : closed ? (
            <dd>
              <a href={`/receipts#${date}`}>Check the record</a>
            </dd>
          ) : (
            <dd className="pending">Shown after you answer</dd>
          )}
        </div>
        <div>
          <dt>Resolves</dt>
          <dd>
            {q.resolves_by}
            <a className="src" href={q.resolution_source} target="_blank" rel="noreferrer">
              {host(q.resolution_source)}
            </a>
          </dd>
        </div>
      </dl>
      {reveal ? (
        <RevealView reveal={reveal} date={date} tiers={tiers} />
      ) : closed ? (
        <p className="closed" role="status">
          Answers closed {shortDate(q.closes_at)}. The next question opens after the next daily run.
        </p>
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
              aria-valuetext={`${value}% chance of yes`}
              onChange={(e) => setValue(Number(e.target.value))}
              style={{ /* design: computed position */ "--fill": `${value}%` } as CSSProperties}
            />
            <span className="slider-ends" aria-hidden="true">
              <span>No</span>
              <span>Yes</span>
            </span>
          </label>
          <button type="submit" className="primary" disabled={busy}>
            Submit {value}%
          </button>
          {status && (
            <p className="small load-error" role="alert">
              {status}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

function RevealView({ reveal, date, tiers }: { reveal: Reveal; date: string; tiers: string[] }) {
  const { count } = reveal.crowd;
  const rows: [string, number | null, string][] = [
    ["You", reveal.you, "your answer"],
    [
      "Visitors",
      reveal.crowd.mean,
      count === 0
        ? "you are the first"
        : `${plural(count, "other self-selected visitor")}${count < 20 ? " so far" : ""}`,
    ],
    [FORECASTER.sim, reveal.sim, "committed forecast"],
    [
      FORECASTER.market,
      reveal.market,
      reveal.market === null ? "no market price" : "price at commit",
    ],
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
            <span
              key={name}
              className={`marker stat-${i}`}
              style={{ /* design: computed position */ left: pct(v) }}
            />
          ),
        )}
      </div>
      <p className="streak">
        <strong>{reveal.streak}</strong> {reveal.streak === 1 ? "day" : "days"} answered in a row
      </p>
      <WeekGrid reveal={reveal} date={date} />
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

function WeekGrid({ reveal, date }: { reveal: Reveal; date: string }) {
  const [copied, setCopied] = useState<boolean | null>(null);
  const text = weekShareText(reveal, date, location.origin);
  return (
    <div className="week">
      <ol className="week-grid" aria-label="Your last seven days">
        {reveal.week.map((w) => {
          const s = square(w);
          const [, meaning, kind] = SQUARES.find(([q]) => q === s) ?? SQUARES[4];
          return (
            <li key={w.date} title={`${shortDate(w.date)}: ${meaning}`}>
              <span className={`sq sq-${kind}`} data-square={kind} aria-hidden="true" />
              <span className="sr-only">
                {shortDate(w.date)}: {meaning}
              </span>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard.writeText(text).then(
            () => setCopied(true),
            () => setCopied(false),
          )
        }
      >
        {copied ? "Copied" : "Copy your week"}
      </button>
      {copied === false && (
        <textarea className="share-text" readOnly rows={4} value={text} aria-label="Your week" />
      )}
      <p className="muted small week-legend">
        {SQUARES.map(([s, m, kind]) => (
          <span key={s}>
            <span className={`sq sq-${kind}`} aria-hidden="true" /> {m}
          </span>
        ))}
      </p>
    </div>
  );
}

import { ApiError, type Daily, type Reveal } from "@real-world/sdk";
import { type CSSProperties, useState } from "react";
import {
  Disclosure,
  FORECASTER,
  failure,
  LoadError,
  Loading,
  pct,
  plural,
  pts,
  SealRow,
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
  const [value, setValue] = useState<number | null>(null);
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
    if (!q || value === null) return;
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
    <div className="call-slips">
      <section className="card receipt daily" aria-labelledby="your-call">
        <div className="receipt-top">
          <span className="slip-kind" id="your-call">
            Your call
          </span>
          {reveal?.outcome != null ? (
            <span className="stamp good">Resolved {reveal.outcome ? "yes" : "no"}</span>
          ) : (
            <span className="stamp">Pending</span>
          )}
        </div>
        <h2 className="question">{q.text}</h2>
        <dl className="receipt-cols">
          <div>
            <dt>The AI's call</dt>
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
              <dd className="pending">Shown after you call</dd>
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
            Answers closed {shortDate(q.closes_at)}. The next question opens after the next daily
            run.
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
              <span className="slider-value">{value === null ? "–" : `${value}%`}</span>
              <span className="sr-only">Your probability that the answer is yes</span>
              <input
                type="range"
                min={0}
                max={100}
                value={value ?? 50}
                className={value === null ? "unset" : undefined}
                aria-valuetext={value === null ? "Not set" : `${value}% chance of yes`}
                onChange={(e) => setValue(Number(e.target.value))}
                // A click on the thumb's resting place changes nothing, so it would not set it.
                onClick={(e) => setValue(Number(e.currentTarget.value))}
                style={
                  { /* design: computed position */ "--fill": `${value ?? 0}%` } as CSSProperties
                }
              />
              <span className="slider-ends" aria-hidden="true">
                <span>No</span>
                <span>Yes</span>
              </span>
            </label>
            <button type="submit" className="primary" disabled={busy || value === null}>
              {value === null ? "Move the slider to call it" : `Call it ${value}%`}
            </button>
            {status && (
              <p className="small load-error" role="alert">
                {status}
              </p>
            )}
          </form>
        )}
      </section>
      <AiSlip daily={loaded.data} reveal={reveal} closed={closed} />
    </div>
  );
}

/** The AI's side: its sealed hash before you call, its number after. */
function AiSlip({
  daily,
  reveal,
  closed,
}: {
  daily: Daily;
  reveal?: Reveal | null;
  closed: boolean;
}) {
  const sealed = daily.sealed;
  return (
    <section className="card receipt ai-slip" aria-labelledby="ai-call">
      <div className="receipt-top">
        <span className="slip-kind" id="ai-call">
          The AI's call
        </span>
        {sealed ? (
          <span className="stamp good">Sealed</span>
        ) : (
          <span className="stamp">Not sealed</span>
        )}
      </div>
      {sealed ? (
        <SealRow hash={sealed.leaf_hash} title="The AI's call is sealed">
          {sealed.leaf_hash.slice(0, 12)} · day record{" "}
          <a href={`/receipts#${sealed.date}`}>{sealed.date}</a>
        </SealRow>
      ) : (
        <SealRow title="No sealed call on this question" />
      )}
      {reveal?.sim != null ? (
        <p className="ai-number">
          <span className="big">{pct(reveal.sim)}</span>
          {sealed && (
            <a className="mono small" href={`/receipts#${sealed.date}`}>
              Sealed {sealed.date} · hash {sealed.leaf_hash.slice(0, 12)}
            </a>
          )}
        </p>
      ) : reveal ? (
        <p className="small">The AI made no call on this question.</p>
      ) : closed ? (
        <p className="small">Answers are closed. Its number is in the day record.</p>
      ) : sealed ? (
        <p className="small">
          Its number is hidden until you call. The hash above was written {sealed.date}, before you
          could answer.
        </p>
      ) : null}
    </section>
  );
}

const NO_QUESTION = "No question today. The next one opens tomorrow.";

/** Today's question on the home: the question, the AI's sealed call and the way to answer. */
export function TodayQuestion() {
  const d = useLoad(() => rw.daily());
  return (
    <section className="today" aria-labelledby="today">
      <h2 id="today">Today's question</h2>
      {d.error ? (
        d.error instanceof ApiError && d.error.status === 404 ? (
          <p className="muted">{NO_QUESTION}</p>
        ) : (
          <LoadError what="today's question" error={d.error} retry={d.retry} />
        )
      ) : !d.data ? (
        <Loading what="today's question" />
      ) : (
        <>
          <p className="today-text">{d.data.question.text}</p>
          {d.data.sealed && (
            <SealRow hash={d.data.sealed.leaf_hash} title="The AI's call is sealed">
              {d.data.sealed.leaf_hash.slice(0, 12)} · day record{" "}
              <a href={`/receipts#${d.data.sealed.date}`}>{d.data.sealed.date}</a>
            </SealRow>
          )}
          <a href="/call" className="button primary">
            Make your call
          </a>
        </>
      )}
    </section>
  );
}

function RevealView({ reveal, date, tiers }: { reveal: Reveal; date: string; tiers: string[] }) {
  const { count } = reveal.crowd;
  const rows: [string, number | null, string][] = [
    ["You", reveal.you, "your call"],
    [
      "Visitors",
      reveal.crowd.mean,
      count === 0
        ? "you are the first"
        : `${plural(count, "other self-selected visitor")}${count < 20 ? " so far" : ""}`,
    ],
    ["AI", reveal.sim, "sealed before you called"],
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
      {reveal.outcome !== null && reveal.you !== null && reveal.sim !== null ? (
        <OutcomeStrip you={reveal.you} ai={reveal.sim} outcome={reveal.outcome} />
      ) : (
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
      )}
      <VsAiLine reveal={reveal} />
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

/** You, the AI and the outcome on one 0-100% track, and who was closer. */
function OutcomeStrip({ you, ai, outcome }: { you: number; ai: number; outcome: number }) {
  const gap = Math.abs(you - outcome) - Math.abs(ai - outcome);
  const closer = Math.abs(gap) < 0.0005 ? "tie" : gap < 0 ? "you" : "the AI";
  return (
    <div className="outcome-strip">
      <span className="shift-track" aria-hidden="true">
        <span
          className="shift-tick"
          style={{ /* design: computed position */ left: pct(outcome) }}
        />
        <span className="shift-dot ai" style={{ /* design: computed position */ left: pct(ai) }} />
        <span className="shift-dot" style={{ /* design: computed position */ left: pct(you) }} />
      </span>
      <p className="mono outcome-marks">
        <span>
          <span className="mark-you" aria-hidden="true" />
          You {pct(you)}
        </span>
        <span>
          <span className="mark-ai" aria-hidden="true" />
          AI {pct(ai)}
        </span>
        <span>
          <span className="mark-outcome" aria-hidden="true" />
          Outcome {outcome ? "Yes" : "No"}
        </span>
      </p>
      <p className="small">
        {closer === "tie"
          ? "Closer: tie."
          : `Closer: ${closer}, by ${pts(Math.abs(gap)).slice(1)}.`}
      </p>
    </div>
  );
}

function VsAiLine({ reveal }: { reveal: Reveal }) {
  const r = reveal.record;
  if (r.n === 0 || r.you === null || r.ai === null)
    return (
      <p className="small">
        Your record against the AI starts when your first called question resolves.
      </p>
    );
  return (
    <p className="small mono">
      You {r.you.toFixed(3)} · AI {r.ai.toFixed(3)} on {plural(r.n, "resolved question")} · you beat
      the AI on {r.wins} (Brier, lower is better)
    </p>
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

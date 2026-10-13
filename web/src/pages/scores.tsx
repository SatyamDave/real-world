import type { Scoreboard } from "@real-world/sdk";
import {
  Disclosure,
  FORECASTER,
  LoadError,
  Loading,
  pct,
  plural,
  shortDate,
  useLoad,
} from "../App";
import { rw } from "../api";
import { Bars, Scatter } from "../Chart";
import { Method } from "../Method";
import { MIN_N_FOR_INTERVAL, SkillCard } from "../Receipts";

export const title = "Scores";

const ORDER = ["sim", "plain_llm", "market"] as const;
const name = (f: string) => (FORECASTER as Record<string, string>)[f] ?? f;
const WORDS = ["no", "one", "two", "three", "four", "five"];
const num = (v: number) => v.toFixed(3);

type Skill = Scoreboard["skill"][string];
type Board = Scoreboard;

const interval = (low: number | null, high: number | null, n: number) =>
  low !== null && high !== null && n >= MIN_N_FOR_INTERVAL
    ? `${num(low)} to ${num(high)}`
    : `none below n = ${MIN_N_FOR_INTERVAL}`;

function Breakdown({ label, groups }: { label: string; groups: Skill["by_tier"] }) {
  const rows = Object.entries(groups);
  if (!rows.length) return null;
  return (
    <section
      className="table-wrap"
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th>{label}</th>
            <th>n</th>
            <th>Mean difference</th>
            <th>95% interval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([g, s]) => (
            <tr key={g}>
              <td>{g}</td>
              <td data-label="n" className="num">
                {s.n}
              </td>
              <td data-label="Mean difference" className="num">
                {s.mean_diff === null ? "—" : `${s.mean_diff > 0 ? "+" : ""}${num(s.mean_diff)}`}
              </td>
              <td data-label="95% interval" className="num">
                {interval(s.low, s.high, s.n)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Skills({ b }: { b: Board }) {
  return (
    <section className="card" aria-labelledby="skill">
      <h2 id="skill">Skill against each baseline</h2>
      <p className="muted small">
        Mean Brier difference, simulation minus baseline, over the questions both forecast. Negative
        means the simulation scored better.
      </p>
      <div className="skills">
        {(["market", "plain_llm"] as const).map((k) => (
          <div key={k}>
            <SkillCard name={name(k)} s={b.skill[k]} />
            {b.skill[k] && (
              <>
                <Breakdown label="Coverage tier" groups={b.skill[k].by_tier} />
                <Breakdown label="Region" groups={b.skill[k].by_region} />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Table({ b }: { b: Board }) {
  const rows = ORDER.map((f) => b.forecasters.find((x) => x.forecaster === f)).filter(
    (x) => x !== undefined,
  );
  return (
    <section className="card" aria-labelledby="board">
      <h2 id="board">Mean Brier score per forecaster</h2>
      <p className="muted small">
        Lower is better. The interval resamples whole days and is shown from n ={" "}
        {MIN_N_FOR_INTERVAL} resolved questions.
      </p>
      <section
        className="table-wrap"
        aria-label="Scores per forecaster"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Forecaster</th>
              <th>Questions</th>
              <th>Mean Brier</th>
              <th>95% interval</th>
              <th>Mean log score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.forecaster}>
                <td>{name(f.forecaster)}</td>
                <td data-label="Questions" className="num">
                  {f.n_questions}
                </td>
                <td
                  data-label="Mean Brier"
                  className="num"
                  title={`${plural(f.n_forecasts, "forecast")} over ${plural(f.n_questions, "question")}`}
                >
                  {num(f.mean_brier)}
                </td>
                <td data-label="95% interval" className="num">
                  {interval(f.brier_low, f.brier_high, f.n_questions)}
                </td>
                <td data-label="Mean log score" className="num">
                  {f.mean_log_score.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Bars
        title="Mean Brier score, a constant 50% forecast is the dashed line"
        domain={[0, 1]}
        reference={b.protocol.coin_reference}
        format={num}
        rows={rows.map((f) => ({
          label: name(f.forecaster),
          value: f.mean_brier,
          low: f.brier_low ?? undefined,
          high: f.brier_high ?? undefined,
          note: `n = ${f.n_questions}`,
        }))}
      />
    </section>
  );
}

function Reliability({ b }: { b: Board }) {
  return (
    <section className="card" aria-labelledby="reliability">
      <h2 id="reliability">Reliability</h2>
      <p className="muted small">
        Each point is one bin of committed probabilities: the mean forecast against how often those
        questions resolved yes. A point on the diagonal means the forecast matched the outcome rate;
        a larger point holds more forecasts. A bin with few forecasts says little.
      </p>
      <div className="reliability">
        {ORDER.filter((f) => b.reliability[f]).map((f) => (
          <Scatter
            key={f}
            title={name(f)}
            xLabel="Mean forecast"
            yLabel="Resolved yes"
            diagonal
            format={pct}
            points={b.reliability[f].map((r) => ({
              x: r.mean_probability,
              y: r.observed_rate,
              n: r.n,
              label: `${pct(r.bin_low)} to ${pct(r.bin_high)}`,
            }))}
          />
        ))}
      </div>
    </section>
  );
}

function Misses({ b }: { b: Board }) {
  const n = b.misses.length;
  if (!n) return null;
  return (
    <section className="card" aria-labelledby="misses">
      <h2 id="misses">Biggest misses</h2>
      <p className="muted small">
        The {WORDS[n] ?? n} worst simulation forecast{n === 1 ? "" : "s"} so far, by Brier score.
      </p>
      <ul className="misses">
        {b.misses.map((m) => (
          <li key={`${m.date}-${m.question_id}`}>
            <span title={m.question_id}>{m.text}</span>
            <span className="num">
              {" "}
              Committed {m.date}: {pct(m.probability)} yes, resolved {m.outcome ? "yes" : "no"}.
              Brier {num(m.brier)}.
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Resolved({ b }: { b: Board }) {
  return (
    <section className="card" aria-labelledby="resolved">
      <h2 id="resolved">Every resolved question</h2>
      <p className="muted small">
        One row per question and committed day, newest first. Each cell is the committed probability
        and its Brier score.
      </p>
      <section
        className="table-wrap"
        aria-label="Resolved questions"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Committed</th>
              <th>Outcome</th>
              {ORDER.map((f) => (
                <th key={f}>{name(f)}</th>
              ))}
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {b.resolved.map((r) => (
              <tr key={`${r.date}-${r.question_id}`}>
                <td>
                  <span title={r.question_id}>{r.text}</span>
                </td>
                <td data-label="Committed" className="num">
                  {r.date}
                </td>
                <td data-label="Outcome" title={`Resolved ${r.resolved_on}`}>
                  {r.outcome ? "Yes" : "No"}
                </td>
                {ORDER.map((f) => (
                  <td key={f} data-label={name(f)} className="num">
                    {r.forecasts[f] ? (
                      <span>
                        {pct(r.forecasts[f].probability)}{" "}
                        <span className="muted">{num(r.forecasts[f].brier)}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
                <td data-label="Coverage">{r.tiers.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

function Header({ b }: { b: Board }) {
  const p = b.protocol;
  return (
    <section className="hero">
      <h1>Scores</h1>
      <p>
        {b.first_commit
          ? `Scored in public since ${shortDate(b.first_commit)}: `
          : "Scored in public: "}
        {plural(b.resolved_questions, "resolved question")}, {b.open_questions} open.
      </p>
      <p className="muted">A constant 50% forecast scores {p.coin_reference} on every question.</p>
      {b.resolved_questions < p.min_resolved_for_claims && (
        <p className="skill-claim" role="status">
          Not enough resolved questions to claim anything: n = {b.resolved_questions} of{" "}
          {p.min_resolved_for_claims}.
        </p>
      )}
      <p className="muted small">
        Protocol {p.version}, hash <code className="mono">{p.hash}</code>{" "}
        <button
          type="button"
          className="link"
          onClick={() => navigator.clipboard?.writeText(p.hash)}
        >
          Copy
        </button>
      </p>
    </section>
  );
}

function Explained({ b }: { b: Board }) {
  const p = b.protocol;
  const raw = b.resolved_questions < p.min_resolved_for_claims;
  return (
    <Method
      source="engine/rw/score.py"
      paper={{
        title: "The Real World Benchmark",
        href: "https://github.com/SatyamDave/real-world/tree/main/papers/real-world-bench",
      }}
    >
      <p>
        Brier score of one forecast: (p − o)², with p the committed probability of yes and o the
        outcome, 1 for yes and 0 for no. Log score: ln of the probability given to what happened,
        with p clipped to [{p.log_clip[0]}, {p.log_clip[1]}]; 0 is perfect and lower is worse.
      </p>
      <p>
        Skill: for every question and day that the simulation and a baseline both forecast, Brier
        (simulation) − Brier (baseline); the mean is shown, and negative means the simulation scored
        better. The interval is a percentile bootstrap over whole days: {p.bootstrap.resamples}{" "}
        resamples, seed {p.bootstrap.seed}, {pct(p.bootstrap.interval)} interval. A comparison is
        claimed only from {p.min_resolved_for_claims} resolved questions
        {raw ? `; this page has ${b.resolved_questions}, so every number above is raw.` : "."}
      </p>
      <p>
        Reliability: the committed probabilities of resolved question-days fall into 10 equal bins;
        each bin shows its mean probability and the share that resolved yes. Empty bins are omitted.
      </p>
      <p className="muted small">
        Protocol {p.version} in <code className="mono">data/protocol.json</code>, hash{" "}
        <code className="mono">{p.hash}</code>. Rules:{" "}
        <a href="https://github.com/SatyamDave/real-world/blob/main/product/benchmark.md">
          product/benchmark.md
        </a>
        ,{" "}
        <a href="https://github.com/SatyamDave/real-world/blob/main/research/science/030-forecast-scoring.md">
          research/science/030-forecast-scoring.md
        </a>
        .
      </p>
    </Method>
  );
}

export default function ScoresRoute() {
  const { data: b, error, retry } = useLoad(() => rw.scoreboard());
  if (error) return <LoadError what="the scoreboard" error={error} retry={retry} />;
  if (!b) return <Loading what="the scoreboard" />;
  const seen = new Map(b.resolved.map((r) => [r.question_id, r.tiers]));
  return (
    <div className="scores">
      <Header b={b} />
      {b.resolved_questions === 0 ? (
        <p className="muted">
          No question has resolved yet. Scores appear when the first one does.
        </p>
      ) : (
        <>
          <Table b={b} />
          <Skills b={b} />
          <Reliability b={b} />
          <Misses b={b} />
          <Resolved b={b} />
        </>
      )}
      <Explained b={b} />
      <p>
        <button type="button" className="primary" onClick={() => location.assign("/receipts")}>
          Verify the receipts
        </button>
      </p>
      <Disclosure tiers={[...seen.values()].flat()} />
    </div>
  );
}

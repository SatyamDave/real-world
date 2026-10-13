import { ApiError, type QuestionPage } from "@real-world/sdk";
import {
  Disclosure,
  FORECASTER,
  LoadError,
  Loading,
  NotFound,
  pct,
  plural,
  TierBadge,
  useLoad,
} from "../App";
import { rw } from "../api";
import { Bars, Trajectory } from "../Chart";
import { Method } from "../Method";

export const title = "Question";

type Day = QuestionPage["days"][number];

const WHO = ["sim", "plain_llm", "market"] as const;
const score = (v: number | null | undefined) => (v == null ? "" : v.toFixed(3));
const host = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

function Header({ p }: { p: QuestionPage }) {
  const q = p.question;
  return (
    <section className="hero">
      <h1>{q.text}</h1>
      <p>
        {p.outcome ? (
          <span className="stamp good">Resolved {p.outcome.outcome ? "yes" : "no"}</span>
        ) : (
          <span className="stamp">Pending</span>
        )}
      </p>
      <p className="muted">
        {q.topic_label} ·{" "}
        {q.countries.map((c) => (
          <span key={c.iso3} className="disclosure-tier">
            {c.name} <TierBadge tier={c.tier} />
          </span>
        ))}
      </p>
      <p className="muted small">
        Opens <span className="mono">{q.opens}</span>, closes{" "}
        <span className="mono">{q.closes}</span>, resolves by{" "}
        <span className="mono">{q.resolves_by}</span> from{" "}
        <a href={q.resolution_source}>{host(q.resolution_source)}</a>. Tie-break: {q.tie_break}
        {p.outcome && (
          <>
            {" "}
            Resolved on <span className="mono">{p.outcome.resolved_on}</span> from{" "}
            <a href={p.outcome.source_url}>{host(p.outcome.source_url)}</a>.
          </>
        )}
      </p>
    </section>
  );
}

function Forecasts({ days }: { days: Day[] }) {
  return (
    <section className="card" aria-labelledby="question-forecasts">
      <h2 id="question-forecasts">Committed forecasts</h2>
      <Trajectory
        title="Simulation forecast by day with p10 to p90"
        domain={[0, 1]}
        format={pct}
        yLabel="Simulation"
        points={days.map((d) => {
          const s = d.forecasts.sim;
          return { x: d.date, y: s.probability, low: s.p10 ?? undefined, high: s.p90 ?? undefined };
        })}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              {WHO.map((w) => (
                <th key={w} scope="col">
                  {FORECASTER[w]}
                </th>
              ))}
              <th scope="col">Brier</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td data-label="Day">
                  <a href={`/receipts#${d.date}`} className="mono">
                    {d.date}
                  </a>
                </td>
                {WHO.map((w) => {
                  const f = d.forecasts[w];
                  return (
                    <td key={w} data-label={FORECASTER[w]} className="num" title={f?.leaf_hash}>
                      {f ? pct(f.probability) : ""}
                      {f?.p10 != null && f.p90 != null && (
                        <span className="muted small">
                          {" "}
                          {pct(f.p10)} to {pct(f.p90)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td data-label="Brier" className="num mono">
                  {WHO.map((w) => score(d.forecasts[w]?.brier)).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        Brier in the order simulation · plain LLM · market, once the question resolves. Hover a
        probability for its leaf hash; the day links its receipt.
      </p>
    </section>
  );
}

function Inputs({ d }: { d: Day }) {
  return (
    <section className="card" aria-labelledby="question-inputs">
      <h2 id="question-inputs">
        What the forecasts read on <span className="mono">{d.date}</span>
      </h2>
      {d.segments.length > 0 ? (
        <Bars
          title="Share answering yes per segment (age · education), after the model call"
          domain={[0, 1]}
          format={pct}
          rows={d.segments.map((s) => ({
            label: s.segment.split("|").slice(1).join(" · "),
            value: s.yes_share,
            note: `before ${pct(s.prior_share)}`,
          }))}
        />
      ) : (
        <p className="muted small">No segment answers were recorded for this day.</p>
      )}
      <p className="muted small">
        Plain LLM samples:{" "}
        {d.plain_samples.length > 0 ? (
          <span className="mono">{d.plain_samples.map(pct).join(" · ")}</span>
        ) : (
          "none recorded"
        )}
      </p>
      <h3>Headlines</h3>
      <ul>
        {d.headlines.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </section>
  );
}

function Computed({ p }: { p: QuestionPage }) {
  const [lo, hi] = p.log_clip;
  return (
    <Method source="api/rw_api/routes_questions.py">
      <p>
        Simulation: one model call per segment, each answer applied to that segment's agents with
        each agent's own offset; the forecast is the mean over agents, and p10 to p90 come from{" "}
        {plural(p.members, "bootstrap resample")} of the agents. Plain LLM: the mean of{" "}
        {plural(p.plain_llm_samples, "sample")} reading the same headlines, without the highest and
        lowest. Market: the price at commit.
      </p>
      <p>
        Scores: Brier <code>(p - outcome)²</code>; log score with p clipped to {lo} to {hi}. A
        constant 50% scores 0.25. A comparison is claimed only after{" "}
        {plural(p.min_resolved, "resolved question")}.
      </p>
      <p>
        Provenance: question hash <span className="mono">{p.question.question_hash}</span> in list{" "}
        <span className="mono">{p.question.question_set_hash}</span>; model{" "}
        <span className="mono">{p.model ?? "none recorded"}</span>
        {p.provider === "fake" && " (fake model, nothing spent)"}.
      </p>
    </Method>
  );
}

function Question({ p }: { p: QuestionPage }) {
  const latest = p.days.at(-1);
  return (
    <div className="question-page">
      <Header p={p} />
      {latest ? (
        <>
          <Forecasts days={p.days} />
          <Inputs d={latest} />
        </>
      ) : (
        <p className="muted">No forecast has been committed on this question yet.</p>
      )}
      <Computed p={p} />
      <Disclosure tiers={p.question.countries.map((c) => c.tier)} />
    </div>
  );
}

export default function QuestionRoute({ param }: { param?: string }) {
  const id = param ?? "";
  const r = useLoad(() => (id ? rw.question(id) : Promise.reject(new Error("no id"))), id);
  if (!id) return <NotFound />;
  if (r.error instanceof ApiError && r.error.status === 404)
    return <p className="muted">No question {id} on the committed list.</p>;
  if (r.error) return <LoadError what="the question" error={r.error} retry={r.retry} />;
  if (!r.data) return <Loading what="the question" />;
  return <Question p={r.data} />;
}

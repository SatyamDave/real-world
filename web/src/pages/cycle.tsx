import { ApiError, type Cycle, type Replay } from "@real-world/sdk";
import { ApiCall } from "../ApiCall";
import {
  Disclosure,
  LoadError,
  Loading,
  pct,
  plural,
  TierBadge,
  topicLabel,
  usd,
  useLoad,
} from "../App";
import { rw } from "../api";
import { Bars } from "../Chart";
import { Method } from "../Method";

export const title = "Cycle";

type Step = Cycle["steps"][number];

const STATUS: Record<Step["status"], string> = {
  ok: "Ran",
  failed: "Failed",
  running: "Running",
  not_run: "Not run",
};
const num = (v: number) => v.toFixed(3);
const clock = (iso: string | null) => (iso ? iso.slice(11, 19) : "—");
const head = (hash: string) => `${hash.slice(0, 8)}…${hash.slice(-8)}`;
const share = (v: number | null) => (v === null ? "—" : pct(v));

function StepStamp({ status }: { status: Step["status"] }) {
  const tone = status === "ok" ? "good" : status === "not_run" ? "plain" : "";
  return <span className={`stamp ${tone}`}>{STATUS[status]}</span>;
}

/** One step's `detail` as `key value` pairs; a long hash is cut to its ends and a list is counted. */
function detailText(detail: Step["detail"]): string {
  if (!detail) return "—";
  return Object.entries(detail)
    .map(([k, v]) => {
      const text = Array.isArray(v)
        ? plural(v.length, "item")
        : typeof v === "string" && /^[0-9a-f]{24,}$/.test(v)
          ? head(v)
          : String(v);
      return `${k.replaceAll("_", " ")} ${text}`;
    })
    .join(" · ");
}

function Steps({ c }: { c: Cycle }) {
  const ran = c.steps.filter((s) => s.status === "ok").length;
  const timed = c.steps.filter((s) => s.seconds !== null);
  return (
    <section className="card" aria-labelledby="cycle-steps">
      <h2 id="cycle-steps">Run log</h2>
      <p className="muted small">
        {ran} of {c.steps.length} steps ran. Model: <span className="mono">{c.model}</span> (
        {c.provider}). Spent <span className="mono">{usd(c.budget.spent_usd)}</span> of a{" "}
        <span className="mono">${c.budget.nightly_budget_usd.toFixed(2)}</span> nightly budget.
        {c.provider === "fake" && " The fake model answers from fixtures, so no money was spent."}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Step</th>
              <th>Status</th>
              <th>Started (UTC)</th>
              <th>Seconds</th>
              <th>Model calls</th>
              <th>Tokens in / out</th>
              <th>Cost</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {c.steps.map((s) => (
              <tr key={s.step}>
                <td data-label="Step">{s.step}</td>
                <td data-label="Status">
                  <StepStamp status={s.status} />
                </td>
                <td data-label="Started (UTC)" className="num">
                  {clock(s.started_at)}
                </td>
                <td data-label="Seconds" className="num">
                  {s.seconds === null ? "—" : s.seconds.toFixed(3)}
                </td>
                <td
                  data-label="Model calls"
                  className="num"
                  title={Object.entries(s.by_purpose)
                    .map(([p, n]) => `${p} ${n}`)
                    .join(", ")}
                >
                  {s.model_calls}
                </td>
                <td data-label="Tokens in / out" className="num">
                  {s.in_tokens.toLocaleString()} / {s.out_tokens.toLocaleString()}
                </td>
                <td data-label="Cost" className="num">
                  {usd(s.cost_usd)}
                </td>
                <td data-label="Detail" className="num cycle-detail">
                  {detailText(s.detail)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {timed.length > 0 && (
        <Bars
          title="Seconds per step"
          format={(v) => v.toFixed(3)}
          rows={timed.map((s) => ({ label: s.step, value: s.seconds ?? 0 }))}
        />
      )}
    </section>
  );
}

function News({ c }: { c: Cycle }) {
  const n = c.news;
  return (
    <section className="card" aria-labelledby="cycle-news">
      <h2 id="cycle-news">News in</h2>
      {n.source === null ? (
        <p className="muted small">The ingest step has not run for this day.</p>
      ) : (
        <p className="muted small">
          Source <span className="mono">{n.source}</span>:{" "}
          {n.articles === null ? "article count not kept" : plural(n.articles, "article")}, grouped
          into {plural(n.clusters, "cluster")} across {plural(n.countries, "country")}. Each cluster
          pushes the topics it bears on; the strongest three per topic are listed.
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Signals</th>
              <th>Mean push</th>
              <th>Strongest items</th>
            </tr>
          </thead>
          <tbody>
            {n.by_topic.map((t) => (
              <tr key={t.topic}>
                <td data-label="Topic">{t.label}</td>
                <td data-label="Signals" className="num">
                  {t.signals}
                </td>
                <td data-label="Mean push" className="num">
                  {t.mean_value === null ? "—" : num(t.mean_value)}
                </td>
                <td data-label="Strongest items" className="cycle-items">
                  {t.top.length === 0 ? (
                    <span className="muted">None</span>
                  ) : (
                    <ul>
                      {t.top.map((i) => (
                        <li key={i.title}>
                          {i.title} <span className="mono">{i.iso3}</span>{" "}
                          <TierBadge tier={i.tier} />
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Assimilation({ c }: { c: Cycle }) {
  const polled = c.assimilation.filter((a) => a.observed !== null).length;
  return (
    <section className="card" aria-labelledby="cycle-assim">
      <h2 id="cycle-assim">What moved</h2>
      {c.assimilation.length === 0 ? (
        <p className="muted small">No world snapshot for this day yet.</p>
      ) : (
        <>
          <p className="muted small">
            {plural(c.assimilation.length, "country-topic share")} before and after the day's news.{" "}
            {polled === 0
              ? "No poll was observed, so nothing was nudged."
              : `${plural(polled, "share")} met a poll and was nudged toward it.`}
          </p>
          <details className="method">
            <summary>Every country and topic</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Topic</th>
                    <th>Before</th>
                    <th>After news</th>
                    <th>Poll</th>
                    <th>Nudge applied</th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {c.assimilation.map((a) => (
                    <tr key={`${a.iso3}-${a.topic}`}>
                      <td data-label="Country">{a.iso3}</td>
                      <td data-label="Topic">{topicLabel(a.topic)}</td>
                      <td data-label="Before" className="num">
                        {share(a.before)}
                      </td>
                      <td data-label="After news" className="num">
                        {share(a.after_news)}
                      </td>
                      <td data-label="Poll" className="num">
                        {a.observed === null ? "—" : `${pct(a.observed)} (n ${a.observed_n})`}
                      </td>
                      <td data-label="Nudge applied" className="num">
                        {a.applied === null ? "—" : num(a.applied)}
                      </td>
                      <td data-label="After" className="num">
                        {share(a.after)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

function Audit({ c }: { c: Cycle }) {
  const out = c.audit.filter((a) => !a.in_band);
  const [lo, hi] = c.settings_used.spread_band;
  return (
    <section className="card" aria-labelledby="cycle-audit">
      <h2 id="cycle-audit">Spread audit</h2>
      {c.audit.length === 0 ? (
        <p className="muted small">Spread audit has not run for this day.</p>
      ) : (
        <>
          <p className="muted small">
            {c.audit.length - out.length} of {c.audit.length} country-topic shares are inside the{" "}
            <span className="mono">
              {lo} to {hi}
            </span>{" "}
            band for the ratio of simulated to survey spread.{" "}
            {c.experimental.length === 0
              ? "No country is experimental."
              : `Experimental today: ${c.experimental.join(", ")}.`}
          </p>
          {out.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Topic</th>
                    <th>SD ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {out.map((a) => (
                    <tr key={`${a.iso3}-${a.topic}`}>
                      <td data-label="Country">{a.iso3}</td>
                      <td data-label="Topic">{topicLabel(a.topic)}</td>
                      <td data-label="SD ratio" className="num">
                        {a.ratio.toFixed(2)} <span className="stamp">Out of band</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Record({ c }: { c: Cycle }) {
  const l = c.ledger;
  return (
    <section className="card" aria-labelledby="cycle-record">
      <h2 id="cycle-record">Day record</h2>
      {l === null ? (
        <p className="muted small">No receipts are hashed for this day yet.</p>
      ) : (
        <p className="muted small">
          {plural(l.leaf_count, "receipt")} under root <span className="mono">{head(l.root)}</span>.
          Record hash <span className="mono">{head(l.record_hash)}</span>. Anchor:{" "}
          {l.anchor === "anchored" ? `anchored ${l.anchored_at}` : l.anchor.replaceAll("_", " ")}.{" "}
          <a href="/receipts">Verify every hash</a>
        </p>
      )}
    </section>
  );
}

function ReplayTable({ r }: { r: Replay }) {
  const same = r.forecasts.filter((f) => f.matches).length;
  return (
    <>
      <p className="muted small">
        The day's forecasts recomputed from the model answers on file, with no new model call:{" "}
        {same} of {r.forecasts.length} equal the committed value. Replay made{" "}
        {plural(r.calls_used, "model call")}.
        {r.missing.length > 0 &&
          ` ${plural(r.missing.length, "forecast")} lack a stored answer and could not be replayed.`}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Forecaster</th>
              <th>Committed</th>
              <th>Replayed</th>
              <th>Difference</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {r.forecasts.map((f) => (
              <tr key={`${f.question_id}-${f.forecaster}`}>
                <td data-label="Question">{f.question ?? f.question_id}</td>
                <td data-label="Forecaster">
                  {f.forecaster === "sim" ? "Simulation" : "Plain LLM"}
                </td>
                <td data-label="Committed" className="num">
                  {pct(f.committed)}
                </td>
                <td data-label="Replayed" className="num">
                  {f.replayed === null ? "—" : pct(f.replayed)}
                </td>
                <td data-label="Difference" className="num">
                  {f.diff === null ? "—" : f.diff.toFixed(4)}
                </td>
                <td data-label="Result">
                  {f.matches ? (
                    <span className="stamp good">Matches</span>
                  ) : f.replayed === null ? (
                    <span className="stamp plain">Not replayable</span>
                  ) : (
                    <span className="stamp">Differs</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Replayed({ date }: { date: string }) {
  const r = useLoad(() => rw.cycle_replay(date), date);
  return (
    <section className="card" aria-labelledby="cycle-replay">
      <h2 id="cycle-replay">Replay</h2>
      {r.error instanceof ApiError && r.error.status === 404 ? (
        <p className="muted small">
          No replay for this day. It needs hashed receipts and a world snapshot.
        </p>
      ) : r.error ? (
        <LoadError what="the replay" error={r.error} retry={r.retry} />
      ) : !r.data ? (
        <Loading what="the replay" />
      ) : (
        <ReplayTable r={r.data} />
      )}
    </section>
  );
}

function Settings({ c }: { c: Cycle }) {
  return (
    <Method source="engine/rw/settings.py">
      <p>
        Engine <span className="mono">{c.engine_version}</span>, config hash{" "}
        <span className="mono">{head(c.config_hash)}</span>. Each value below is the one this cycle
        ran with.
      </p>
      <p>
        {Object.entries(c.settings_used).map(([k, v]) => (
          <span key={k} className="world-floor">
            <code>{k}</code>{" "}
            <span className="mono">{Array.isArray(v) ? v.join(" to ") : String(v)}</span>
          </span>
        ))}
      </p>
    </Method>
  );
}

function Day({ c }: { c: Cycle }) {
  return (
    <div className="cycle">
      <section className="hero">
        <h1>The daily cycle</h1>
        <p className="muted">
          Cycle of <span className="mono">{c.date}</span>: the steps the engine ran, what each cost
          and what moved the simulated world.
        </p>
        <nav className="cycle-dates" aria-label="Cycle dates">
          {c.dates.map((d) => (
            <a key={d} href={`/cycle/${d}`} aria-current={d === c.date ? "page" : undefined}>
              {d}
            </a>
          ))}
        </nav>
      </section>
      <Steps c={c} />
      <News c={c} />
      <Assimilation c={c} />
      <Audit c={c} />
      <Record c={c} />
      <Replayed date={c.date} />
      <Settings c={c} />
      <ApiCall
        path={`/v1/cycle/${c.date}`}
        sdk={`cycle("${c.date}")`}
        data={c}
        filename={`cycle-${c.date}`}
      />
      <Disclosure tiers={[]} />
    </div>
  );
}

export default function CycleRoute({ param }: { param?: string }) {
  const r = useLoad(() => rw.cycle(param), param ?? "latest");
  if (r.error instanceof ApiError && r.error.status === 404)
    return (
      <p className="muted">
        {param
          ? `No cycle ran on ${param}.`
          : "No cycle has run yet. The first daily cycle creates one."}
      </p>
    );
  if (r.error) return <LoadError what="the cycle" error={r.error} retry={r.retry} />;
  if (!r.data) return <Loading what="the cycle" />;
  return <Day c={r.data} />;
}

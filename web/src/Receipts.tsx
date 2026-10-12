import { useState } from "react";
import { Disclosure, LoadError, useLoad } from "./App";
import {
  type Receipt,
  type ReceiptDay,
  receiptDay,
  receipts,
  type Skill,
  scores,
  type Tier,
} from "./api";
import { verifyChain } from "./verify";

const FORECASTER: Record<string, string> = {
  sim: "Simulation",
  plain_llm: "Plain LLM",
  market: "Market",
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-4)}`;

function Outcome({ r }: { r: Receipt }) {
  if (r.outcome === undefined || r.outcome === null) return <span className="muted">open</span>;
  return (
    <span>
      {r.outcome ? "yes" : "no"}
      {r.brier !== undefined && r.brier !== null && (
        <span className="muted"> · Brier {r.brier.toFixed(3)}</span>
      )}
    </span>
  );
}

async function latestEntries(n: number): Promise<Receipt[]> {
  const out: Receipt[] = [];
  for (const d of (await receipts()).days) {
    if (out.length >= n) break;
    out.push(...(await receiptDay(d.date)).entries);
  }
  return out.slice(0, n);
}

export function ReceiptsStrip() {
  const { data, error } = useLoad(() => latestEntries(10));
  return (
    <section className="card strip">
      <div className="strip-head">
        <h2>Latest receipts</h2>
        <a href="/receipts" className="strip-link">
          All receipts and verify →
        </a>
      </div>
      {error && <LoadError what="receipts" error={error} />}
      {data && !data.length && <p className="muted small">No forecasts committed yet.</p>}
      <ul className="strip-rows">
        {data?.map((r) => (
          <li key={r.leaf_hash}>
            <span className={`who who-${r.entry.forecaster}`}>
              {FORECASTER[r.entry.forecaster] ?? r.entry.forecaster}
            </span>
            <span className="strip-q">{r.entry.question_id}</span>
            <span className="num">{Math.round(Number(r.entry.probability) * 100)}%</span>
            <Outcome r={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SkillCard({ name, s }: { name: string; s?: Skill }) {
  return (
    <div className="skill">
      <h3>Simulation vs {name}</h3>
      {!s ? null : s.mean_diff === null ? (
        <p className="muted small">No resolved questions yet (n = {s.n}).</p>
      ) : (
        <p>
          <span className="skill-value">
            {s.mean_diff > 0 ? "+" : ""}
            {s.mean_diff.toFixed(3)}
          </span>
          <span className="muted small">
            {" "}
            mean Brier difference, 95% interval {s.low?.toFixed(3)} to {s.high?.toFixed(3)}, n ={" "}
            {s.n} questions. Negative means the simulation scored better.
          </span>
        </p>
      )}
      {s?.claim === "insufficient_n" && (
        <p className="small claim">
          insufficient_n: fewer than 100 resolved questions, so no comparative claim is made.
        </p>
      )}
    </div>
  );
}

export function ReceiptsPage({ tiers }: { tiers: Tier[] }) {
  const sc = useLoad(scores);
  const all = useLoad(async () =>
    Promise.all(
      (await receipts()).days.map(async (d) => ({
        ...(await receiptDay(d.date)),
        anchored: d.anchored,
      })),
    ),
  );
  const [result, setResult] = useState<Record<string, string[]> | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function verify(days: ReceiptDay[]) {
    setVerifying(true);
    try {
      setResult(await verifyChain([...days].reverse()));
    } catch (e) {
      setResult({ "": [`could not verify: ${(e as Error).message}`] });
    } finally {
      setVerifying(false);
    }
  }

  const problems = result ? Object.values(result).flat() : [];
  const leaves = all.data?.reduce((n, d) => n + d.entries.length, 0) ?? 0;

  return (
    <div className="receipts">
      <section className="hero">
        <p className="eyebrow">Receipts</p>
        <h1>Every forecast, hashed before its outcome existed</h1>
        <p className="muted">
          Each forecast is salted, hashed into that day's Merkle root, and chained to the day
          before. Verify recomputes every hash in your browser, without trusting this server.
        </p>
        <div className="verify-row">
          <button
            type="button"
            className="primary"
            disabled={!all.data?.length || verifying}
            onClick={() => all.data && verify(all.data)}
          >
            {verifying ? "Verifying" : "Verify in this browser"}
          </button>
          {result && (
            <span className={problems.length ? "bad" : "good"} aria-live="polite">
              {problems.length
                ? `${plural(problems.length, "problem")} found`
                : `Verified ${plural(Object.keys(result).length, "day")} and ${plural(leaves, "receipt")} back to the first day`}
            </span>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Scores</h2>
        <p className="muted small">
          Brier score: lower is better. A constant 50% forecast scores 0.25 on every question.
        </p>
        {sc.error && <LoadError what="scores" error={sc.error} />}
        <div className="skills">
          <SkillCard name="market" s={sc.data?.market} />
          <SkillCard name="plain LLM" s={sc.data?.plain_llm} />
        </div>
      </section>

      {all.error && <LoadError what="receipts" error={all.error} />}
      {all.data && !all.data.length && <p className="muted">No days committed yet.</p>}
      {all.data?.map((d) => (
        <section key={d.day.date} className="card day">
          <div className="day-head">
            <h2>{d.day.date}</h2>
            <span className="badge">{d.anchored ? "anchored" : "not yet anchored"}</span>
            {result?.[d.day.date] &&
              (result[d.day.date].length ? (
                <span className="bad small">{result[d.day.date].join("; ")}</span>
              ) : (
                <span className="good small">verified</span>
              ))}
          </div>
          <dl className="hashes">
            <div>
              <dt>Root</dt>
              <dd title={d.day.root}>{short(d.day.root)}</dd>
            </div>
            <div>
              <dt>Previous root</dt>
              <dd title={d.day.prev_root}>{short(d.day.prev_root)}</dd>
            </div>
            <div>
              <dt>Record hash</dt>
              <dd title={d.record_hash}>{short(d.record_hash)}</dd>
            </div>
            <div>
              <dt>Leaves</dt>
              <dd>{d.day.leaf_count}</dd>
            </div>
          </dl>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Forecaster</th>
                  <th>Probability</th>
                  <th>Market at commit</th>
                  <th>Committed</th>
                  <th>Leaf hash</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {d.entries.map((r) => (
                  <tr key={r.leaf_hash}>
                    <td>{r.entry.question_id}</td>
                    <td>{FORECASTER[r.entry.forecaster] ?? r.entry.forecaster}</td>
                    <td className="num">{r.entry.probability}</td>
                    <td className="num">{r.entry.market_price_at_commit || "—"}</td>
                    <td>{r.entry.committed_at}</td>
                    <td className="mono" title={r.leaf_hash}>
                      {short(r.leaf_hash)}
                    </td>
                    <td>
                      <Outcome r={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <Disclosure tiers={tiers} />
    </div>
  );
}

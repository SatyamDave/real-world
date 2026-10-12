import type { ReceiptDay, ReceiptEntry, Skill } from "@real-world/sdk";
import { useEffect, useState } from "react";
import { Disclosure, LoadError, Loading, plural, useLoad } from "./App";
import { rw } from "./api";
import { verifyChain } from "./verify";

const FORECASTER: Record<string, string> = {
  sim: "Simulation",
  plain_llm: "Plain LLM",
  market: "Market",
};

const short = (h: string) => `${h.slice(0, 8)}…${h.slice(-4)}`;

// Entry values are canonical JSON: strings, or a list of question ids on the question_set leaf.
const str = (v: unknown) => (typeof v === "string" ? v : "");
const isForecast = (r: ReceiptEntry) => r.entry.kind === "forecast";

/** "0.4139" as "41%"; an empty value as a dash. */
const prob = (v: unknown) => (str(v) ? `${Math.round(Number(v) * 100)}%` : "—");

/** The question's text, with its id on hover; the id alone on a leaf with no question. */
function Question({ r }: { r: ReceiptEntry }) {
  const id = str(r.entry.question_id);
  return r.question ? <span title={id}>{r.question.text}</span> : <>{id}</>;
}

const DAY_MS = 86_400_000;

/** Whole days from the commit to the question's resolution date, in UTC. */
export function daysBeforeResolution(at: string, resolvesBy: string): number {
  return Math.floor((Date.parse(resolvesBy) - Date.parse(at)) / DAY_MS);
}

/** Local time, with the committed UTC string on hover, and how long before resolution it was. */
function Committed({ r }: { r: ReceiptEntry }) {
  const at = str(r.entry.committed_at);
  if (!at) return <span className="muted">—</span>;
  const local = new Date(at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const days = r.question ? daysBeforeResolution(at, r.question.resolves_by) : null;
  return (
    <>
      <time dateTime={at} title={at}>
        {local}
      </time>
      {days !== null && (
        <span className="muted small committed-note">
          {days >= 1
            ? `${plural(days, "day")} before resolution`
            : days === 0
              ? "on its resolution date"
              : "after its resolution date"}
        </span>
      )}
    </>
  );
}

function Outcome({ r }: { r: ReceiptEntry }) {
  if (r.outcome === undefined || r.outcome === null)
    return <span className="pending">Pending</span>;
  return (
    <span>
      {r.outcome ? "yes" : "no"}
      {r.brier !== undefined && r.brier !== null && (
        <span className="muted"> · Brier {r.brier.toFixed(3)}</span>
      )}
    </span>
  );
}

async function latestEntries(n: number): Promise<ReceiptEntry[]> {
  const out: ReceiptEntry[] = [];
  for (const d of (await rw.receipts()).days) {
    if (out.length >= n) break;
    out.push(...(await rw.receipt_day(d.date)).entries.filter(isForecast));
  }
  return out.slice(0, n);
}

export function ReceiptsStrip() {
  const { data, error, retry } = useLoad(() => latestEntries(10));
  return (
    <section className="card receipt strip">
      <div className="receipt-top">
        <h2>Latest receipts</h2>
        <a href="/receipts" className="strip-link">
          Verify all receipts
        </a>
      </div>
      {error && <LoadError what="receipts" error={error} retry={retry} />}
      {!data && !error && <Loading what="receipts" />}
      {data && !data.length && <p className="muted small">No forecasts committed yet.</p>}
      <ul className="strip-rows">
        {data?.map((r) => (
          <li key={r.leaf_hash}>
            <span className={`who who-${str(r.entry.forecaster)}`}>
              {FORECASTER[str(r.entry.forecaster)] ?? str(r.entry.forecaster)}
            </span>
            <span className="strip-q">
              <Question r={r} />
            </span>
            <span className="num">{prob(r.entry.probability)}</span>
            <Outcome r={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Below this many resolved questions an interval says nothing, so none is shown.
const MIN_N_FOR_INTERVAL = 10;

function SkillCard({ name, s }: { name: string; s?: Skill }) {
  if (!s) return <div className="skill" />;
  const diff = s.mean_diff;
  const detail =
    diff === null
      ? null
      : `Mean Brier difference ${diff > 0 ? "+" : ""}${diff.toFixed(3)}${
          s.n >= MIN_N_FOR_INTERVAL && s.low !== null && s.high !== null
            ? `, 95% interval ${s.low.toFixed(3)} to ${s.high.toFixed(3)}`
            : ""
        }. Negative means the simulation scored better.`;
  return (
    <div className="skill">
      <h3>Simulation vs {name}</h3>
      {s.claim === "insufficient_n" ? (
        <>
          <p className="skill-claim">No claim yet</p>
          <p className="small">
            n = {plural(s.n, "resolved question")}. A comparison is claimed only after 100 resolve.
          </p>
        </>
      ) : (
        <p className="skill-value">n = {s.n}</p>
      )}
      {detail && <p className="muted small">{detail}</p>}
    </div>
  );
}

function AnchorBadge({ d }: { d: ReceiptDay }) {
  const token = d.anchors.find((a) => a.kind === "rfc3161");
  if (d.anchor === "anchored" && token) {
    return (
      <span className="badge stamp good">
        anchored {d.anchored_at?.replace("T", " ").replace("Z", " UTC")} by{" "}
        {new URL(token.service).host} (
        <a
          download={`${d.day.date}.tsr`}
          href={`data:application/timestamp-reply;base64,${token.proof_base64}`}
        >
          RFC 3161 token
        </a>
        )
      </span>
    );
  }
  if (d.anchor === "pending") {
    return (
      <span className="badge stamp">
        anchor pending: OpenTimestamps proof awaits a Bitcoin block
      </span>
    );
  }
  return <span className="badge stamp">not yet anchored</span>;
}

export function ReceiptsPage({ tiers }: { tiers: string[] }) {
  const sc = useLoad(() => rw.scores());
  const all = useLoad(async () =>
    Promise.all((await rw.receipts()).days.map((d) => rw.receipt_day(d.date))),
  );
  const [result, setResult] = useState<Record<string, string[]> | null>(null);
  const [verifying, setVerifying] = useState(false);

  // A shared "/receipts#<date>" link lands on its day once the days have loaded.
  useEffect(() => {
    if (all.data && location.hash)
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [all.data]);

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
        {sc.error && <LoadError what="scores" error={sc.error} retry={sc.retry} />}
        {!sc.data && !sc.error && <Loading what="scores" />}
        <div className="skills">
          <SkillCard name="market" s={sc.data?.market} />
          <SkillCard name="plain LLM" s={sc.data?.plain_llm} />
        </div>
      </section>

      {all.error && <LoadError what="receipts" error={all.error} retry={all.retry} />}
      {!all.data && !all.error && <Loading what="receipts" />}
      {all.data && !all.data.length && <p className="muted">No days committed yet.</p>}
      {all.data?.map((d) => (
        <section key={d.day.date} id={d.day.date} className="card receipt day">
          <div className="day-head">
            <h2>{d.day.date}</h2>
            <AnchorBadge d={d} />
            {result?.[d.day.date] &&
              (result[d.day.date].length ? (
                <span className="bad small">{result[d.day.date].join("; ")}</span>
              ) : (
                <span className="stamp good">Verified</span>
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
          <section
            className="table-wrap"
            aria-label={`Forecasts committed ${d.day.date}`}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
            tabIndex={0}
          >
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
                    <td>
                      {isForecast(r) ? (
                        <Question r={r} />
                      ) : (
                        `Question set, ${(r.entry.question_ids as string[])?.length ?? 0} questions`
                      )}
                    </td>
                    <td data-label="Forecaster">
                      {FORECASTER[str(r.entry.forecaster)] ?? str(r.entry.forecaster)}
                    </td>
                    <td data-label="Probability" className="num" title={str(r.entry.probability)}>
                      {prob(r.entry.probability)}
                    </td>
                    <td
                      data-label="Market at commit"
                      className="num"
                      title={str(r.entry.market_price_at_commit)}
                    >
                      {prob(r.entry.market_price_at_commit)}
                    </td>
                    <td data-label="Committed">
                      <Committed r={r} />
                    </td>
                    <td data-label="Leaf hash" className="mono" title={r.leaf_hash}>
                      {short(r.leaf_hash)}
                    </td>
                    <td data-label="Outcome">
                      <Outcome r={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </section>
      ))}
      <Disclosure tiers={tiers} />
    </div>
  );
}

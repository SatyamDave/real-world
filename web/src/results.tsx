import type { PostTestOut, SegmentReaction, SimulateResult } from "@real-world/sdk";
import { Disclosure, pct, pts, SealGrid, TierBadge, topicLabel, usd } from "./App";
import { Trajectory } from "./Chart";
import { signInHref } from "./session";

export const MIX: [keyof PostTestOut["result"]["mix"], string][] = [
  ["scroll_past", "Scroll past"],
  ["read", "Read"],
  ["like", "Like"],
  ["share", "Share"],
];

/** The reaction mix as one bar whose parts add to 100%. */
export function MixBar({ mix }: { mix: PostTestOut["result"]["mix"] }) {
  return (
    <div className="mixbar" role="img" aria-label="Reaction mix">
      {MIX.map(([k, label]) => (
        <span
          key={k}
          className={`mixbar-${k}`}
          style={{ /* design: computed width */ flexGrow: mix[k] }}
          title={`${label} ${pct(mix[k])}`}
        >
          {label} {pct(mix[k])}
        </span>
      ))}
    </div>
  );
}

const AGE_BANDS = ["18-34", "35-54", "55+"] as const;
const EDUCATION = ["low", "mid", "high"] as const;

/** Integer counts summing to `n`, by largest remainder (engine/rw/population.py `allocate`). */
function allocate(n: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const exact = weights.map((w) => (n * w) / total);
  const counts = exact.map(Math.floor);
  const order = exact.map((e, i) => [e - counts[i], i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order.slice(0, n - counts.reduce((a, b) => a + b, 0))) counts[i] += 1;
  return counts;
}

/** The audience as 100 dots split by population weight; filled dots would like or share it. */
export function PopulationField({ rows }: { rows: SegmentReaction[] }) {
  const sorted = [...rows].sort(
    (a, b) => a.country.localeCompare(b.country) || b.landing - a.landing,
  );
  const counts = allocate(
    100,
    sorted.map((s) => s.weight),
  );
  const dots = sorted.flatMap((s, i) =>
    Array.from({ length: counts[i] }, (_, j) => ({
      label: s.label,
      on: j < Math.round(s.landing * counts[i]),
    })),
  );
  const filled = dots.filter((d) => d.on).length;
  const line = `Filled dots would like or share it: ${filled} of 100. Weighted by population.`;
  return (
    <>
      <h3>The audience, one dot per 1%</h3>
      <div className="field" role="img" aria-label={line}>
        {dots.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed 100-dot drawing
          <span key={i} className={d.on ? "on" : undefined} title={d.label} />
        ))}
      </div>
      <p className="muted small">{line}</p>
    </>
  );
}

/** Landing chance per segment as a country by age band by education table. */
export function SegmentMatrix({ rows }: { rows: SegmentReaction[] }) {
  const bySegment = new Map(rows.map((s) => [s.segment, s]));
  const countries = [...new Map(rows.map((s) => [s.country, s.coverage_tier])).entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return (
    <section
      className="matrix-wrap"
      aria-label="Landing chance by segment"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable
      tabIndex={0}
    >
      <table className="matrix">
        <caption>Landing chance by country, age band and education</caption>
        <thead>
          <tr>
            <th rowSpan={2} scope="col">
              Country
            </th>
            {AGE_BANDS.map((a) => (
              <th key={a} colSpan={3} scope="colgroup" className="mono">
                {a}
              </th>
            ))}
          </tr>
          <tr>
            {AGE_BANDS.flatMap((a) =>
              EDUCATION.map((e) => (
                <th key={`${a}-${e}`} scope="col">
                  {e}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {countries.map(([iso, tier]) => (
            <tr key={iso}>
              <th scope="row">
                <span className="mono">{iso}</span> <TierBadge tier={tier} />
              </th>
              {AGE_BANDS.flatMap((a) =>
                EDUCATION.map((e) => {
                  const s = bySegment.get(`${iso}|${a}|${e}`);
                  return s ? (
                    <td
                      key={`${a}-${e}`}
                      className={`mono m${Math.min(4, Math.floor(s.landing * 5))}`}
                    >
                      {pct(s.landing)}
                    </td>
                  ) : (
                    <td key={`${a}-${e}`} className="mono muted">
                      <span aria-hidden="true">–</span>
                      <span className="sr-only">Not asked</span>
                    </td>
                  );
                }),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Each topic's share before and after a fork: the p10-p90 band, a tick at before, a dot at p50. */
export function BeliefShifts({ result }: { result: SimulateResult }) {
  const rows = Object.entries(result.outputs).sort(
    ([, a], [, b]) =>
      Math.abs(b.final.p50 - b.baseline_share) - Math.abs(a.final.p50 - a.baseline_share),
  );
  const at = (v: number) => `${(Math.min(1, Math.max(0, v)) * 100).toFixed(1)}%`;
  return (
    <>
      <h3>Beliefs before and after</h3>
      <p className="muted small">
        Median after {result.days} days, with p10 to p90 across {result.members} members. Tick:
        before.
      </p>
      <ul className="shifts">
        {rows.map(([t, o]) => (
          <li key={t}>
            <span className="shift-label">{topicLabel(t)}</span>
            <span className="shift-track" aria-hidden="true">
              <span
                className="shift-band"
                style={{
                  /* design: computed position */ left: at(o.final.p10),
                  width: at(o.final.p90 - o.final.p10),
                }}
              />
              <span
                className="shift-tick"
                style={{ /* design: computed position */ left: at(o.baseline_share) }}
              />
              <span
                className="shift-dot"
                style={{ /* design: computed position */ left: at(o.final.p50) }}
              />
            </span>
            <span className="mono shift-text">
              {pct(o.baseline_share)} → {pct(o.final.p50)} ({pts(o.final.p50 - o.baseline_share)})
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

const utc = (iso: string) => `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC`;

/** The slip's foot: the seal drawn and written out, or an empty grid and how to get one. */
function SealLine({ seal }: { seal: PostTestOut["seal"] }) {
  return seal ? (
    <div className="seal-line seal">
      <SealGrid hash={seal.sha256} large />
      <div>
        <p className="small">Sealed {utc(seal.sealed_at)}</p>
        <p className="mono seal-hash">
          {[0, 16, 32, 48].map((i) => (
            <span key={i}>{seal.sha256.slice(i, i + 16)}</span>
          ))}
        </p>
        <p className="small">
          <a href="/record">Mark it in your record once you know how it did</a>
        </p>
      </div>
    </div>
  ) : (
    <div className="seal-line">
      <SealGrid />
      <p className="small">
        Not sealed. Sign in to seal this test and keep your record.{" "}
        <a href={signInHref()}>Sign in</a>
      </p>
    </div>
  );
}

function Segments({ title, rows }: { title: string; rows: SegmentReaction[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul className="segments">
        {rows.map((s) => (
          <li key={s.segment}>
            <span>{s.label}</span>
            <span className="mono">{pct(s.landing)}</span>
            <TierBadge tier={s.coverage_tier} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReactionResult({
  out,
  text,
  signedIn,
  onRetest,
}: {
  out: PostTestOut;
  text: string;
  signedIn: boolean;
  onRetest: (post: string) => void;
}) {
  const r = out.result;
  const fake = r.provider === "fake";
  return (
    <section className="card receipt land-result" aria-live="polite">
      <div className="receipt-top">
        <span className="slip-kind">Post test</span>
        <span className={`stamp${out.seal ? " good" : ""}`}>
          {out.seal ? "Sealed" : "Not sealed"}
        </span>
      </div>
      <blockquote className="slip-quote">{text}</blockquote>
      <p className="land-chance">
        <span className="big">{pct(r.landing_chance)}</span>
        <span>landing chance: the share of this audience who would like or share it</span>
      </p>
      <p className="muted small">
        {pct(r.band[0])} to {pct(r.band[1])} across {r.segments} audiences (p10 to p90).{" "}
        {r.calibration}.
      </p>
      <PopulationField rows={r.audiences} />
      <h3>Reaction mix</h3>
      <MixBar mix={r.mix} />
      <SegmentMatrix rows={r.audiences} />
      <div className="land-sides">
        <Segments title="Most likely to like or share it" rows={r.best} />
        <Segments title="Least likely" rows={r.worst} />
      </div>
      <h3>Two simulated accounts</h3>
      {r.voices.map((v) => (
        <blockquote key={v.label} className="voice">
          <span className="stamp">
            {v.simulated}
            {fake ? ", fake model, placeholder text" : ""}
          </span>
          <p>{v.text}</p>
          <footer className="muted small">{v.label}</footer>
        </blockquote>
      ))}
      <div className="rewrite">
        <h3>One rewrite to test</h3>
        <p>{r.rewrite}</p>
        <button type="button" onClick={() => onRetest(r.rewrite)}>
          Test this version
        </button>
      </div>
      {(out.seal || !signedIn) && <SealLine seal={out.seal} />}
      <p className="muted small">
        {r.model_calls} model calls · {fake ? "fake model, nothing spent" : usd(r.cost_usd)}
      </p>
      <Disclosure tiers={r.audiences.map((s) => s.coverage_tier)} />
    </section>
  );
}

export function EventResult({ result, text }: { result: SimulateResult; text: string }) {
  const topics = Object.entries(result.outputs);
  const moved = topics
    .map(([t, o]) => [t, o.final.p50 - o.baseline_share] as const)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const [lead] = moved;
  const leadOut = lead ? result.outputs[lead[0]] : undefined;
  const fake = result.provider === "fake";
  return (
    <section className="card receipt event-result" aria-live="polite">
      <div className="receipt-top">
        <span className="slip-kind">
          Fork · {result.days} simulated days from the world of {result.world_snapshot_id}
        </span>
        <span className="stamp">{result.note}</span>
      </div>
      <blockquote className="slip-quote">{text}</blockquote>
      {lead && (
        <p className="land-chance">
          <span className="big">{pts(lead[1])}</span>
          <span>
            {topicLabel(lead[0])}, the largest move after {result.days} simulated days
          </span>
        </p>
      )}
      <BeliefShifts result={result} />
      {lead && leadOut && (
        <Trajectory
          title={`${topicLabel(lead[0])} by simulated day`}
          domain={[0, 1]}
          format={pct}
          yLabel="Share"
          reference={leadOut.baseline_share}
          points={leadOut.by_day.map((d) => ({
            x: `Day ${d.day}`,
            y: d.p50,
            low: d.p10,
            high: d.p90,
          }))}
        />
      )}
      <h3>Largest segment shifts</h3>
      <ul className="segments">
        {result.top_shifts.map((s) => (
          <li key={`${s.segment}-${s.topic}`}>
            <span>
              {topicLabel(s.topic)} · {s.segment.replaceAll("|", " · ")} · n = {s.n_agents}
            </span>
            <span className="mono">{pts(s.shift_p50)}</span>
            <TierBadge tier={s.tier} />
          </li>
        ))}
      </ul>
      <p className="muted small">
        {result.members} members · {result.agents_sampled} agents · {result.days} days ·{" "}
        {fake ? "fake model, nothing spent" : usd(result.cost.actual_usd)}
      </p>
      <Disclosure tiers={result.coverage.map((c) => c.tier)} />
    </section>
  );
}

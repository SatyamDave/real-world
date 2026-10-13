import type { PostTestOut, SegmentReaction, SimulateResult } from "@real-world/sdk";
import type { CSSProperties } from "react";
import { Disclosure, pct, pts, TierBadge, topicLabel, usd } from "./App";
import { Bars, Trajectory } from "./Chart";
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

/** Every audience asked, as a tile shaded by the share who would like or share the post. */
export function Heatmap({ rows }: { rows: SegmentReaction[] }) {
  return (
    <ul className="heatmap" aria-label="Landing chance by audience">
      {rows.map((s) => {
        const [iso, age, education] = s.segment.split("|");
        return (
          <li
            key={s.segment}
            title={`${s.label}: ${pct(s.landing)}`}
            style={
              {
                /* design: computed shade */ "--shade": `${Math.round(s.landing * 60)}%`,
              } as CSSProperties
            }
          >
            <span className="mono heat-value">{pct(s.landing)}</span>
            <span className="heat-who">
              {iso} · {age} · {education}
            </span>
            <TierBadge tier={s.coverage_tier} />
          </li>
        );
      })}
    </ul>
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
  signedIn,
  onRetest,
}: {
  out: PostTestOut;
  signedIn: boolean;
  onRetest: (post: string) => void;
}) {
  const r = out.result;
  const fake = r.provider === "fake";
  return (
    <section className="card receipt land-result" aria-live="polite">
      <div className="receipt-top">
        <span className="eyebrow">Reaction</span>
        <span className={`stamp${out.seal ? " good" : ""}`}>
          {out.seal ? "Sealed" : "Not sealed"}
        </span>
      </div>
      <p className="land-chance">
        <span className="big">{pct(r.landing_chance)}</span>
        <span>landing chance: the share of this audience who would like or share it</span>
      </p>
      <p className="muted small">
        {pct(r.band[0])} to {pct(r.band[1])} across {r.segments} audiences (p10 to p90).{" "}
        {r.calibration}.
      </p>
      <MixBar mix={r.mix} />
      <h3>Every audience asked</h3>
      <Heatmap rows={r.audiences} />
      <div className="land-sides">
        <Segments title="Most likely to like or share it" rows={r.best} />
        <Segments title="Least likely" rows={r.worst} />
      </div>
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
      {out.seal ? (
        <p className="small mono seal">
          Sealed {new Date(out.seal.sealed_at).toLocaleString()} · {out.seal.sha256.slice(0, 12)}.{" "}
          <a href="/record">Mark it in your record once you know how it did</a>
        </p>
      ) : (
        !signedIn && (
          <p className="small">
            Sign in to seal this test and keep your record. <a href={signInHref()}>Sign in</a>
          </p>
        )
      )}
      <p className="muted small">
        {r.model_calls} model calls · {fake ? "fake model, nothing spent" : usd(r.cost_usd)}
      </p>
      <Disclosure tiers={r.audiences.map((s) => s.coverage_tier)} />
    </section>
  );
}

export function EventResult({ result }: { result: SimulateResult }) {
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
        <span className="eyebrow">Event</span>
        <span className="stamp">{result.note}</span>
      </div>
      {lead && (
        <p className="land-chance">
          <span className="big">{pts(lead[1])}</span>
          <span>
            {topicLabel(lead[0])}, the largest move after {result.days} simulated days
          </span>
        </p>
      )}
      <Bars
        title="Share before and after, with p10 to p90 across members"
        domain={[0, 1]}
        format={pct}
        rows={topics.map(([t, o]) => ({
          label: topicLabel(t),
          value: o.final.p50,
          low: o.final.p10,
          high: o.final.p90,
          note: `before ${pct(o.baseline_share)}`,
        }))}
      />
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

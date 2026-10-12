import { ApiError, type Estimate, type Job, type PrefilledEvent } from "@real-world/sdk";
import { useEffect, useState } from "react";
import { Disclosure, LoadError, pct, pts, TierBadge, topicLabel } from "./App";
import { rw } from "./api";

const EVENT_MAX_CHARS = 500;

type Progress = { member: number; members: number; day: number; days: number };

export function Fork({ events }: { events: PrefilledEvent[] }) {
  const [text, setText] = useState("");
  const [est, setEst] = useState<{ for: string; value?: Estimate; error?: string } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const trimmed = text.trim();

  useEffect(() => {
    if (!trimmed) return;
    let live = true;
    const t = setTimeout(() => {
      rw.estimate({ event: { text: trimmed } }).then(
        (value) => live && setEst({ for: trimmed, value }),
        (e: Error) => live && setEst({ for: trimmed, error: e.message }),
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [trimmed]);

  const current = est?.for === trimmed ? est : null;

  async function run() {
    setStatus("Starting");
    try {
      setJobId((await rw.simulate({ event: { text: trimmed } })).id);
      setStatus("");
    } catch (e) {
      const refused = e instanceof ApiError && e.status === 422 ? policyDetail(e.body) : null;
      setStatus(refused ? `Refused: ${refused}` : `Not started: ${(e as Error).message}`);
    }
  }

  return (
    <section className="card fork">
      <h2>Fork today's world</h2>
      <p className="muted small">
        Add one event, run seven simulated days on a sample of the population, and get a card you
        can share.
      </p>
      <div className="chips">
        {events.map((e) => (
          <button
            key={e.id}
            type="button"
            className="chip"
            aria-pressed={trimmed === e.text}
            onClick={() => setText(e.text)}
          >
            {e.text}
          </button>
        ))}
      </div>
      <label className="field">
        <span className="sr-only">Event</span>
        <textarea
          value={text}
          maxLength={EVENT_MAX_CHARS}
          rows={2}
          placeholder="Or describe an event in plain words"
          onChange={(e) => setText(e.target.value)}
        />
        <span className="counter">
          {text.length}/{EVENT_MAX_CHARS}
        </span>
      </label>
      <div className="run-row">
        <span className="muted small">
          {!trimmed
            ? "Pick or write an event to see its estimated cost."
            : !current
              ? "Estimating cost"
              : current.error
                ? `Estimate failed: ${current.error}`
                : current.value?.within_cap
                  ? `Estimated $${current.value.estimated_cost_usd.toFixed(4)} · ${current.value.model_calls} model calls`
                  : `Refused: estimated $${current.value?.estimated_cost_usd.toFixed(4)} is over the cost cap`}
        </span>
        <button
          type="button"
          className="primary"
          disabled={!current?.value?.within_cap || status === "Starting"}
          onClick={run}
        >
          Run fork
        </button>
      </div>
      {status && status !== "Starting" && <p className="muted small">{status}</p>}
      {jobId && <ForkRun key={jobId} id={jobId} />}
    </section>
  );
}

function policyDetail(body: unknown): string | null {
  const b = body as { code?: unknown; detail?: unknown } | null;
  return typeof b?.code === "string" && typeof b.detail === "string" ? b.detail : null;
}

export function ForkRun({ id }: { id: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      let j = await rw.get_simulation(id);
      if (!live) return;
      setJob(j);
      if (j.status === "queued" || j.status === "running") {
        for await (const e of rw.events(id)) {
          if (!live) return;
          if (e.type === "progress") setProgress(e as unknown as Progress);
        }
        j = await rw.get_simulation(id);
        if (live) setJob(j);
      }
    })().catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [id]);

  if (error) return <LoadError what="this fork" error={error} />;
  if (job?.status === "failed") return <p className="muted">Fork failed: {job.error}</p>;
  if (job?.status === "succeeded" && job.result) return <ForkCard job={job} />;
  return (
    <p className="progress" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {progress?.member
        ? `Run ${progress.member} of ${progress.members} · day ${progress.day} of ${progress.days}`
        : job
          ? "Queued"
          : "Loading fork"}
    </p>
  );
}

export function ForkCard({ job }: { job: Job }) {
  const r = job.result;
  const [copied, setCopied] = useState(false);
  if (!r) return null;
  const link = `${location.origin}/fork/${job.id}`;
  const topics = Object.entries(r.outputs);
  return (
    <article className="fork-card">
      <p className="eyebrow">Fork result</p>
      <p className="setup">
        “{job.request.event.text}”, applied to the {r.world_snapshot_id} world and run for {r.days}{" "}
        days on {r.agents_sampled.toLocaleString()} sampled agents.
      </p>

      <h3>Top shifts</h3>
      <ol className="shifts">
        {r.top_shifts.slice(0, 3).map((s) => (
          <li key={`${s.segment}-${s.topic}`}>
            <span className="shift-who">
              {s.segment.split("|").join(" · ")} <TierBadge tier={s.tier} />
            </span>
            <span className="shift-topic">{topicLabel(s.topic)}</span>
            <span className={`shift-value ${s.shift_p50 >= 0 ? "up" : "down"}`}>
              {pts(s.shift_p50)}
            </span>
          </li>
        ))}
      </ol>

      <h3>Share leaning yes, before and after</h3>
      <p className="muted small">
        Bars show the p10-p90 range across {r.members} simulated runs, not a confidence interval
        yet. The tick is the share before the event.
      </p>
      <ul className="bands">
        {topics.map(([topic, o]) => (
          <li key={topic}>
            <span className="band-label">{topicLabel(topic)}</span>
            <span className="band-track" aria-hidden="true">
              <span
                className="band-range"
                style={{ left: pct(o.final.p10), width: pct(o.final.p90 - o.final.p10) }}
              />
              <span className="band-base" style={{ left: pct(o.baseline_share) }} />
              <span className="band-mid" style={{ left: pct(o.final.p50) }} />
            </span>
            <span className="band-value">
              {pct(o.baseline_share)} → {pct(o.final.p50)}
              <span className="muted">
                {" "}
                ({pct(o.final.p10)}–{pct(o.final.p90)})
              </span>
            </span>
          </li>
        ))}
      </ul>

      <dl className="facts">
        <div>
          <dt>Coverage</dt>
          <dd className="coverage">
            {r.coverage.map((c) => (
              <span key={c.iso3}>
                {c.iso3} <TierBadge tier={c.tier} />
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>
            ${r.cost.actual_usd.toFixed(4)}{" "}
            <span className="muted">(estimated ${r.cost.estimated_usd.toFixed(4)})</span>
          </dd>
        </div>
        <div>
          <dt>Scoring</dt>
          <dd>{r.note}</dd>
        </div>
      </dl>

      <div className="share">
        <input
          readOnly
          value={link}
          aria-label="Link to this fork"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(link).then(
              () => setCopied(true),
              () => setCopied(false),
            )
          }
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <Disclosure tiers={r.coverage.map((c) => c.tier)} />
    </article>
  );
}

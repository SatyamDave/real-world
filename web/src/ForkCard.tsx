import { ApiError, type Estimate, type Job, type PrefilledEvent } from "@real-world/sdk";
import { useEffect, useState } from "react";
import {
  Disclosure,
  LoadError,
  Loading,
  pct,
  plural,
  pts,
  TierBadge,
  topicLabel,
  usd,
} from "./App";
import { rw } from "./api";
import { bandText, forkImage, forkSentence, forkShareText, segmentLabel } from "./share";

const EVENT_MAX_CHARS = 500;

type Progress = { member: number; members: number; day: number; days: number };

export function Fork({ events }: { events: PrefilledEvent[] }) {
  const [text, setText] = useState("");
  const [est, setEst] = useState<{ for: string; value?: Estimate; failed?: true } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<{ text: string; policy: boolean } | null>(null);
  const trimmed = text.trim();

  useEffect(() => {
    if (!trimmed) return;
    let live = true;
    const t = setTimeout(() => {
      rw.estimate({ event: { text: trimmed } }).then(
        (value) => live && setEst({ for: trimmed, value }),
        () => live && setEst({ for: trimmed, failed: true }),
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [trimmed]);

  const current = est?.for === trimmed ? est : null;

  async function run() {
    setBusy(true);
    setRefusal(null);
    try {
      setJobId((await rw.simulate({ event: { text: trimmed } })).id);
    } catch (e) {
      const detail = e instanceof ApiError ? refusalDetail(e.body) : null;
      setRefusal({
        text: detail ? withStop(detail) : "The server did not accept the fork.",
        policy: e instanceof ApiError && e.status === 422,
      });
    }
    setBusy(false);
  }

  return (
    <>
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
          <span className="muted small" aria-live="polite">
            {!trimmed
              ? "Pick or write an event to see its estimated cost."
              : !current
                ? "Estimating cost"
                : current.failed
                  ? "Could not estimate the cost."
                  : current.value?.within_cap
                    ? `Estimated ${usd(current.value.estimated_cost_usd)}, ${plural(current.value.model_calls, "model call")}`
                    : `Estimated ${usd(current.value?.estimated_cost_usd ?? 0)} is over the cost cap.`}
          </span>
          <button
            type="button"
            className="primary"
            disabled={!current?.value?.within_cap || busy}
            onClick={run}
          >
            Run fork
          </button>
        </div>
        {refusal && (
          <p className="bad small" role="alert">
            {refusal.text} {refusal.policy && <a href="/acceptable-use">See acceptable use.</a>}
          </p>
        )}
      </section>
      {jobId && <ForkRun key={jobId} id={jobId} />}
    </>
  );
}

const withStop = (sentence: string) => `${sentence.replace(/\.$/, "")}.`;

/** The API's literal sentence from a refusal that carries a stable code. */
function refusalDetail(body: unknown): string | null {
  const b = body as { code?: unknown; detail?: unknown } | null;
  return typeof b?.code === "string" && typeof b.detail === "string" ? b.detail : null;
}

export function ForkRun({ id }: { id: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      let j = await rw.get_simulation(id);
      if (!live) return;
      setJob(j);
      document.title = `${j.request.event.text} · Real World fork`;
      if (j.status === "queued" || j.status === "running") {
        for await (const e of rw.events(id)) {
          if (!live) return;
          if (e.type === "progress") setProgress(e as unknown as Progress);
        }
        j = await rw.get_simulation(id);
        if (live) setJob(j);
      }
    })().catch((e: Error) => {
      if (!live) return;
      if (e instanceof ApiError && e.status === 404) document.title = "Fork not found · Real World";
      setError(e);
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (error instanceof ApiError && error.status === 404)
    return (
      <section className="card notfound">
        <h1>Fork not found</h1>
        <p className="muted">
          This fork does not exist or has expired. <a href="/">Fork today's world</a>
        </p>
      </section>
    );
  if (error) return <LoadError what="this fork" error={error} />;
  if (job?.status === "failed")
    return (
      <p className="bad small" role="alert">
        This fork did not finish. <a href="/">Fork today's world</a> to run it again.
      </p>
    );
  if (job?.status === "succeeded" && job.result) return <ForkCard job={job} />;
  return (
    <Loading
      what={
        progress?.member
          ? `fork: member ${progress.member} of ${progress.members}, day ${progress.day} of ${progress.days}`
          : job
            ? "fork: queued"
            : "fork"
      }
    />
  );
}

/** Band positions on an axis zoomed to one band's values, so a 1 pt move is visible. */
function axis(values: number[]) {
  const lo = Math.max(0, Math.floor((Math.min(...values) - 0.05) * 20) / 20);
  const hi = Math.min(1, Math.ceil((Math.max(...values) + 0.05) * 20) / 20);
  return { lo, hi, at: (v: number) => `${((v - lo) / (hi - lo)) * 100}%` };
}

export function ForkCard({ job }: { job: Job }) {
  const r = job.result;
  const [shared, setShared] = useState("");
  if (!r) return null;
  const link = `${location.origin}/fork/${job.id}`;
  const topics = Object.entries(r.outputs);
  const copy = (what: string, text: string) =>
    navigator.clipboard.writeText(text).then(
      () => setShared(`${what} copied`),
      () => setShared("Could not copy. Select the link above."),
    );
  async function saveImage() {
    try {
      const url = URL.createObjectURL(await forkImage(job, link));
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `${job.id}.png`,
      });
      a.click();
      URL.revokeObjectURL(url);
      setShared("Image saved");
    } catch (e) {
      setShared((e as Error).message);
    }
  }
  return (
    <article className="card receipt fork-card" aria-labelledby={`fork-${job.id}`}>
      <div className="receipt-top">
        <span>Fork result</span>
        <span className="stamp plain">AI-simulated</span>
      </div>
      <h1 className="setup" id={`fork-${job.id}`}>
        “{job.request.event.text.replace(/\.$/, "")}”, applied to the {r.world_snapshot_id} world
        and run for {r.days} days on {r.agents_sampled.toLocaleString()} sampled agents.
      </h1>
      <p className="meaning">{forkSentence(r)}</p>

      <h3>Top shifts</h3>
      {r.top_shifts.length ? (
        <ol className="shifts">
          {r.top_shifts.slice(0, 3).map((s) => (
            <li key={`${s.segment}-${s.topic}`}>
              <span className="shift-who">
                {segmentLabel(s.segment)} <TierBadge tier={s.tier} />
                <span className="muted small"> n = {plural(s.n_agents, "agent")}</span>
              </span>
              <span className="shift-topic">{topicLabel(s.topic)}</span>
              <span className={`shift-value ${s.shift_p50 >= 0 ? "up" : "down"}`}>
                {pts(s.shift_p50)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">
          No segment of at least {plural(r.top_shift_min_agents, "agent")} moved.
        </p>
      )}

      <h3>Share leaning yes, before and after</h3>
      <p className="muted small">
        Bars show the spread, the p10-p90 range across {r.members} ensemble members, not a
        confidence interval yet. The tick is the share before the event. Each bar is zoomed to its
        own values; hover it for the axis.
      </p>
      <ul className="bands">
        {topics.map(([topic, o]) => {
          const ax = axis([o.baseline_share, o.final.p10, o.final.p90]);
          return (
            <li key={topic}>
              <span className="band-label">{topicLabel(topic)}</span>
              <span
                className="band-track"
                aria-hidden="true"
                title={`Axis ${pct(ax.lo)} to ${pct(ax.hi)}`}
              >
                <span
                  className="band-range"
                  style={{
                    /* design: computed position */
                    left: ax.at(o.final.p10),
                    width: `max(4px, ${((o.final.p90 - o.final.p10) / (ax.hi - ax.lo)) * 100}%)`,
                  }}
                />
                <span
                  className="band-base"
                  style={{ /* design: computed position */ left: ax.at(o.baseline_share) }}
                />
                <span
                  className="band-mid"
                  style={{ /* design: computed position */ left: ax.at(o.final.p50) }}
                />
              </span>
              <span className="band-value">{bandText(o)}</span>
            </li>
          );
        })}
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
            {r.provider === "fake" ? (
              <>
                Fake model, nothing spent{" "}
                <span className="muted">
                  (a real run is estimated at {usd(r.cost.estimated_usd)})
                </span>
              </>
            ) : (
              <>
                {usd(r.cost.actual_usd)}{" "}
                <span className="muted">(estimated {usd(r.cost.estimated_usd)})</span>
              </>
            )}
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
        <button type="button" onClick={() => copy("Link", link)}>
          Copy link
        </button>
        <button type="button" onClick={() => copy("Text", forkShareText(job, link))}>
          Copy text
        </button>
        <button type="button" onClick={saveImage}>
          Save image
        </button>
      </div>
      {shared && (
        <p className="muted small" role="status">
          {shared}
        </p>
      )}
      <Disclosure tiers={r.coverage.map((c) => c.tier)} />
    </article>
  );
}

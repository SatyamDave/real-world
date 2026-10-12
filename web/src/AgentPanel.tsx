import type { Country } from "@real-world/sdk";
import { useEffect, useRef } from "react";
import { Disclosure, LoadError, Loading, pct, pts, TierBadge, topicLabel, useLoad } from "./App";
import { rw } from "./api";
import { shareDeltas, traitWords } from "./share";

export function AgentPanel({ country, onClose }: { country: Country; onClose: () => void }) {
  const id = country.sample_agent_id;
  const a = useLoad(() => rw.agent(id), id);
  const why = useLoad(() => rw.agent_why(id), id);
  const close = useRef<HTMLButtonElement>(null);

  const deltas = a.data ? shareDeltas(a.data) : [];

  // Focus moves into the panel on open and back to what opened it on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);

  return (
    <aside className="panel" aria-label={`One sampled agent in ${country.name}`}>
      <header className="panel-head">
        <div>
          <p className="eyebrow">One sampled agent</p>
          <h2>
            {country.name} <TierBadge tier={country.tier} />
          </h2>
          {country.experimental && (
            <p className="warn small">Experimental today: simulated spread is off from surveys.</p>
          )}
        </div>
        <button ref={close} type="button" className="icon" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      {a.error && <LoadError what="this agent" error={a.error} retry={a.retry} />}
      {!a.data && !a.error && <Loading what="this agent" />}
      {a.data && (
        <p className="traits">
          {traitWords(a.data.traits).join(" · ")}
          <span className="muted"> · agent {a.data.agent_id}</span>
        </p>
      )}

      <section>
        <h3>What moved this agent</h3>
        <p className="muted small">Change in its chance of leaning yes, in percentage points.</p>
        {a.data &&
          (a.data.moved.length ? (
            <ol className="moves">
              {a.data.moved.map((m, i) => (
                <li key={`${m.date}-${m.topic}-${m.cause}`}>
                  <span className="move-head">
                    <span>{topicLabel(m.topic)}</span>
                    <span className={m.delta >= 0 ? "up" : "down"}>
                      {deltas[i] === null ? `${m.delta.toFixed(2)} logit` : pts(deltas[i] ?? 0)}
                    </span>
                  </span>
                  <span className="muted small">
                    {m.date} · {m.cause}
                    {a.data?.shares[m.topic] !== undefined &&
                      ` · now ${pct(a.data.shares[m.topic])}`}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted small">No belief changes recorded for this agent.</p>
          ))}
      </section>

      <section>
        <h3>In its own words</h3>
        <p className="label-simulated">Simulated account, not the cause</p>
        {why.error && <LoadError what="this account" error={why.error} retry={why.retry} />}
        {why.data ? (
          <blockquote>{why.data.text}</blockquote>
        ) : (
          !why.error && (
            <p className="muted small" role="status">
              Writing the account
            </p>
          )
        )}
      </section>

      <Disclosure tiers={[country.tier]} />
    </aside>
  );
}

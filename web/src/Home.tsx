import { useState } from "react";
import {
  Disclosure,
  LoadError,
  Loading,
  pct,
  SealGrid,
  TierBadge,
  topicLabel,
  useLoad,
} from "./App";
import { rw } from "./api";
import { caseHref, type Primitive, USE_CASES, WHO } from "./usecases";

const KIND = { reaction: "Post test", event: "Fork", call: "Call it" } as const;
const ANCHOR = {
  anchored: "anchored",
  pending: "anchor pending",
  not_anchored: "not anchored",
} as const;

/** The prepared decisions grouped by who they serve; `only` keeps one simulation kind. */
export function UseCaseList({ only, onPick }: { only?: Primitive; onPick?: (id: string) => void }) {
  return (
    <div className="decision-groups">
      {WHO.map(([who, name]) => {
        const rows = USE_CASES.filter((u) => u.who === who && (!only || u.primitive === only));
        if (!rows.length) return null;
        return (
          <div key={who}>
            <h3>{name}</h3>
            <ul className="decision-rows">
              {rows.map((u) => {
                const body = (
                  <>
                    <span className="kind-tag mono">{KIND[u.primitive]}</span>
                    <strong>{u.title}</strong>
                    <span className="muted">{u.blurb}</span>
                    <span className="mono muted decision-audience">{u.audience}</span>
                  </>
                );
                return (
                  <li key={u.id}>
                    {onPick && u.primitive !== "call" ? (
                      <button type="button" onClick={() => onPick(u.id)}>
                        {body}
                      </button>
                    ) : (
                      <a href={caseHref(u)}>{body}</a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Register() {
  const world = useLoad(() => rw.world());
  const status = useLoad(() => rw.status());
  const [belief, setBelief] = useState("inflation_worry");
  const error = world.error ?? status.error;
  if (error)
    return (
      <LoadError
        what="today's populations"
        error={error}
        retry={() => {
          world.retry();
          status.retry();
        }}
      />
    );
  if (!world.data || !status.data) return <Loading what="today's populations" />;
  const { countries, date } = world.data;
  const s = status.data;
  return (
    <>
      <p className="muted register-caption">
        World of <span className="mono">{date}</span>. The simulated share leaning yes on one
        belief, by country.
      </p>
      <label className="register-belief">
        <span>Belief</span>
        <select value={belief} onChange={(e) => setBelief(e.target.value)}>
          {Object.keys(countries[0]?.shares ?? {}).map((t) => (
            <option key={t} value={t}>
              {topicLabel(t)}
            </option>
          ))}
        </select>
      </label>
      <ul className="register-rows">
        {countries.map((c) => {
          const share = c.shares[belief] ?? 0;
          return (
            <li key={c.iso3}>
              <span className="mono register-iso">{c.iso3}</span>
              <span className="register-name">{c.name}</span>
              <TierBadge tier={c.tier} />
              <span className="register-bar" aria-hidden="true">
                <span
                  style={{ /* design: computed width */ width: `${Math.round(share * 100)}%` }}
                />
              </span>
              <span className="mono register-share">{pct(share)}</span>
            </li>
          );
        })}
      </ul>
      <div className="register-foot">
        <SealGrid hash={s.root} large />
        {s.root && s.date ? (
          <p className="mono small">
            Day record {s.date} · root {s.root.slice(0, 8)}…{s.root.slice(-8)} ·{" "}
            {s.anchor ? ANCHOR[s.anchor] : "not anchored"}.{" "}
            <a href={`/receipts#${s.date}`}>Check it on Receipts</a>
          </p>
        ) : (
          <p className="mono small">No day record yet</p>
        )}
      </div>
      <Disclosure tiers={countries.map((c) => c.tier)} />
    </>
  );
}

export function Home() {
  return (
    <div className="home">
      <div className="home-top">
        <section className="home-ask">
          <h1>Will this land?</h1>
          <p className="lead muted">
            Test a post on simulated audiences in 16 countries before you publish. Every test you
            seal is scored when you mark how it did.
          </p>
          <form action="/simulate" method="get" className="ask-form">
            <label htmlFor="home-text">Your post</label>
            <textarea
              id="home-text"
              name="text"
              rows={4}
              maxLength={500}
              placeholder="Paste a tweet, a caption, a headline or a hook"
            />
            <button type="submit" className="primary">
              Test it
            </button>
          </form>
          <p className="muted">
            Or <a href="/call">call today's question</a> against the AI, whose call is sealed before
            you answer.
          </p>
        </section>
        <section className="card register" aria-labelledby="register">
          <h2 id="register">Today's simulated populations</h2>
          <Register />
        </section>
      </div>
      <section className="decisions" aria-labelledby="decisions">
        <h2 id="decisions">Start from a real decision</h2>
        <p className="muted">
          Each one opens the simulator filled in. Change anything before you run it.
        </p>
        <UseCaseList />
      </section>
      <section className="proof-line" aria-labelledby="proof">
        <h2 id="proof">Sealed before the outcome</h2>
        <p className="muted">
          The AI's daily calls are hashed before the outcome and scored in public, misses included.
          Your sealed tests are scored against your own gut.
        </p>
        <p className="proof-links">
          <a href="/receipts">Receipts</a>
          <a href="/scores">Scores</a>
          <a href="/record">Your record</a>
        </p>
      </section>
    </div>
  );
}

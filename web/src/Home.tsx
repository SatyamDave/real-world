import { useState } from "react";
import {
  ANCHOR,
  Disclosure,
  LoadError,
  Loading,
  pct,
  SealRow,
  TierBadge,
  topicLabel,
  useLoad,
} from "./App";
import { rw } from "./api";
import { TodayQuestion } from "./DailyQuestion";
import { MixBar } from "./results";
import { caseHref, findUseCase, type Primitive, USE_CASES, WHO } from "./usecases";

const KIND = { reaction: "Post test", event: "Event", call: "Call it" } as const;

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
        {s.root && s.date ? (
          <SealRow hash={s.root} title={`Day record ${s.date}`}>
            root {s.root.slice(0, 8)}…{s.root.slice(-8)} ·{" "}
            {s.anchor ? ANCHOR[s.anchor] : "not anchored"} ·{" "}
            <a href={`/receipts#${s.date}`}>Check it on Receipts</a>
          </SealRow>
        ) : (
          <SealRow title="No day record yet" />
        )}
      </div>
      <Disclosure tiers={countries.map((c) => c.tier)} />
    </>
  );
}

const MADE_FOR = [
  ["Creators", "Test a hook before you post it.", "video-hook"],
  ["Small brands", "Check a price change before customers see it.", "price-rise"],
  ["Founders", "Test a launch post before launch day.", "launch-post"],
  ["Newsrooms", "Test a headline on younger and older readers.", "grocery-headline"],
] as const;

/** A fixed, labelled example of the post test result, so a visitor sees the output first. */
function ExampleResult() {
  return (
    <section className="card receipt example-slip" aria-labelledby="example">
      <div className="receipt-top">
        <span className="slip-kind" id="example">
          Example result
        </span>
        <span className="stamp plain">Example</span>
      </div>
      <blockquote className="slip-quote">Half price for students, this week only.</blockquote>
      <p className="land-chance">
        <span className="big">41%</span>
        <span>of this audience would like or share it</span>
      </p>
      <MixBar mix={{ scroll_past: 0.32, read: 0.27, like: 0.25, share: 0.16 }} />
      <p className="small">
        Most likely: adults 18 to 34 in India, 63%. Least likely: adults 55 and over in Japan, 18%.
      </p>
      <p className="muted small">
        Example numbers, not a real test. Every real result is AI-simulated and shows the coverage
        tier of each country.
      </p>
    </section>
  );
}

export function Home() {
  return (
    <div className="home">
      <div className="home-top">
        <section className="home-ask">
          <h1>See how people react before you post.</h1>
          <p className="lead">
            For creators, small brands, founders and anyone about to post something that matters.
          </p>
          <p className="muted">
            Paste a post. Real World simulates how audiences in 16 countries, by age and education,
            react to it: who scrolls past, who reads it, who likes it and who shares it, with two
            simulated accounts in their own words. Every result is AI-simulated.
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
              Test my post
            </button>
          </form>
          <p className="muted small">
            Or <a href="/call">play today's question against the AI</a>.
          </p>
          <ol className="steps">
            <li>
              <span className="mono">1</span> Paste your post
            </li>
            <li>
              <span className="mono">2</span> Pick who sees it
            </li>
            <li>
              <span className="mono">3</span> See who reacts, and what they say
            </li>
          </ol>
        </section>
        <ExampleResult />
      </div>
      <section aria-labelledby="made-for">
        <h2 id="made-for">Made for</h2>
        <ul className="made-for">
          {MADE_FOR.map(([who, what, id]) => {
            const u = findUseCase(id);
            return (
              <li key={who}>
                <a href={u ? caseHref(u) : "/simulate"} className="card made-card">
                  <strong>{who}</strong>
                  <span>{what}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="home-top home-proof">
        <section className="home-ask">
          <TodayQuestion />
          <div className="proof-line">
            <h2>Sealed before the outcome</h2>
            <p className="muted">
              The AI's daily calls are hashed before the outcome and scored in public, misses
              included. Your sealed tests are scored against your own gut.
            </p>
            <p className="proof-links">
              <a href="/receipts">Receipts</a>
              <a href="/scores">Scores</a>
              <a href="/record">Your record</a>
            </p>
          </div>
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
    </div>
  );
}

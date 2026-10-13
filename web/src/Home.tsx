import { MixBar } from "./results";
import { caseHref, USE_CASES } from "./usecases";

/** The prepared decisions; each opens the simulator filled in. */
export function UseCaseList() {
  return (
    <ul className="decision-rows">
      {USE_CASES.map((u) => (
        <li key={u.id}>
          <a href={caseHref(u)}>
            <span className="kind-tag">{u.category}</span>
            <strong>{u.idea}</strong>
            <span className="muted">{u.icp}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A fixed, labelled example of a message test result, so a visitor sees the output first. */
function ExampleResult() {
  return (
    <section className="card receipt example-slip" aria-labelledby="example">
      <div className="receipt-top">
        <span className="slip-kind" id="example">
          Example result: a launch message
        </span>
        <span className="stamp plain">Example</span>
      </div>
      <blockquote className="slip-quote">
        Sleep cool or send them back. 100 nights to decide, and we pay the return shipping.
      </blockquote>
      <p className="land-chance">
        <span className="big">41%</span>
        <span>of these simulated consumers would like or share it</span>
      </p>
      <MixBar mix={{ ignore: 0.32, read: 0.27, like: 0.25, share: 0.16 }} />
      <p className="muted small">
        Example numbers, not a real test. Every real result is AI-simulated and shows its coverage
        tier.
      </p>
    </section>
  );
}

export function Home() {
  return (
    <div className="home">
      <div className="home-top">
        <section className="home-ask">
          <h1>Test your message on simulated consumers before you ship it.</h1>
          <p className="lead muted">
            Paste a launch message, a price change or a headline. Real World simulates how your
            ideal consumer reacts: who ignores it, who likes it, who shares it, and what simulated
            people say about it. Every result is AI-simulated.
          </p>
          <form action="/simulate" method="get" className="ask-form">
            <label htmlFor="home-text">Your message</label>
            <textarea
              id="home-text"
              name="text"
              rows={4}
              maxLength={500}
              placeholder="Paste a launch message, a price change or a headline"
            />
            <button type="submit" className="primary">
              Test my message
            </button>
          </form>
          <p className="muted small">Free while in beta. Enterprise on request.</p>
          <p className="muted small">
            Not sure how it works? <a href="/how-it-works">Read how it works</a>. The engine's own
            forecasts are scored in the <a href="/receipts">Public record</a>.
          </p>
        </section>
        <ExampleResult />
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

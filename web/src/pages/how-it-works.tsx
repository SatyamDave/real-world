export const title = "How it works";

const STEPS = [
  "You describe your idea, your ideal consumer and your message.",
  "The engine simulates many AI consumers across 27 segments, built from attitude to new products, price sensitivity and category familiarity, with Jev.",
  "Every test also runs a plain baseline, so you can see whether the segment engine beats it.",
  "Backtest on messages you already shipped, to see how the engine would have called them.",
  "Mark your real results once you have them. A mark cannot be changed afterwards.",
];

export default function HowItWorks() {
  return (
    <div className="how-it-works">
      <section className="thesis" aria-labelledby="how-title">
        <h1 id="how-title">How it works</h1>
        <p>
          The results are AI-simulated. They are not real customers, and the engine is not
          calibrated yet. Read a result as a signal to check, not a forecast to trust.
        </p>
      </section>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <span className="mono">{i + 1}</span> {s}
          </li>
        ))}
      </ol>
      <p>
        The engine also forecasts real events every day and seals each forecast before the outcome,
        scored in public. See the <a href="/receipts">Public record</a>.
      </p>
      <p>Free while in beta. Enterprise on request.</p>
      <p className="muted small">
        Signed in, your sealed tests and marks are stored on our server; signed out, nothing is
        stored. See the <a href="/privacy">privacy page</a>.
      </p>
    </div>
  );
}

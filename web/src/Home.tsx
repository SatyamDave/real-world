import type { ReactNode } from "react";
import { USE_CASES } from "./usecases";

// Shapes of real results, drawn small: the cards teach what each primitive returns.
const REACTION_GRID = [0.7, 0.62, 0.55, 0.48, 0.41, 0.36, 0.66, 0.31, 0.24, 0.52, 0.18, 0.44];
const EVENT_DAYS = [0.42, 0.45, 0.49, 0.53, 0.55, 0.56, 0.57];
const CALL_BINS = [0.04, 0.09, 0.2, 0.31, 0.22, 0.1, 0.04];

function Primitive(p: {
  name: string;
  kind: string;
  instruction: string;
  output: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <article className="primitive">
      <p className="primitive-kind mono">PRIMITIVE · {p.kind}</p>
      <h3 className="primitive-name mono">{p.name}</h3>
      <p className="primitive-label mono">INSTRUCTIONS</p>
      <p className="primitive-instruction mono">{p.instruction}</p>
      <div className="primitive-art" aria-hidden="true">
        {p.children}
      </div>
      <p className="primitive-label mono">EXAMPLE OUTPUT</p>
      <p className="primitive-output mono">
        <span className="primitive-value">{p.value}</span> {p.output}
      </p>
    </article>
  );
}

export function Home() {
  return (
    <div className="console-home">
      <section className="hero-band">
        <div className="hero-copy">
          <p className="mono eyebrow">THREE PRIMITIVES · ONE ENGINE</p>
          <h1>Learn to simulate</h1>
          <p>
            Test how people react before it happens. Every result is AI-simulated, and every call
            you seal is scored.
          </p>
          <a className="button primary" href="/playground">
            Playground →
          </a>
        </div>
        <div className="primitives">
          <Primitive
            name="REACTION"
            kind="AUDIENCE"
            instruction="HOW DOES THIS AUDIENCE REACT TO A POST?"
            value="54%"
            output="landing chance"
          >
            <span className="dots">
              {REACTION_GRID.map((v, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed drawing
                  key={i}
                  style={{ /* design: computed shade */ opacity: 0.2 + 0.8 * v }}
                />
              ))}
            </span>
          </Primitive>
          <Primitive
            name="EVENT"
            kind="FORK"
            instruction="HOW DO BELIEFS SHIFT AFTER ONE EVENT?"
            value="+15 pts"
            output="inflation worry, day 7"
          >
            <svg viewBox="0 0 140 60" className="spark">
              <title>Example: a share rising over seven simulated days</title>
              <polyline
                points={EVENT_DAYS.map((v, i) => `${i * 22 + 4},${56 - v * 90}`).join(" ")}
              />
            </svg>
          </Primitive>
          <Primitive
            name="CALL"
            kind="SEALED"
            instruction="WILL THIS HAPPEN?"
            value="62%"
            output="sealed before the outcome"
          >
            <span className="bins">
              {CALL_BINS.map((v, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed drawing
                  key={i}
                  style={{ /* design: computed height */ height: `${v * 160}px` }}
                />
              ))}
            </span>
          </Primitive>
        </div>
      </section>
      <div className="home-columns">
        <section className="in-action" aria-labelledby="in-action">
          <h2 id="in-action">Real World in action</h2>
          <ul className="usecases">
            {USE_CASES.map((u) => (
              <li key={u.id}>
                <a href={`/playground?use=${u.id}`}>
                  <span className="usecase-tag mono">
                    {u.primitive === "reaction" ? "Reaction" : "Event"}
                  </span>
                  <strong>{u.title}</strong>
                  <span className="muted">{u.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        <aside className="quickstart" aria-labelledby="quickstart">
          <h2 id="quickstart">Quickstart</h2>
          <ol>
            <li>Pick a use case, or paste your own post or event in the playground.</li>
            <li>Run it: the engine asks each simulated audience and draws the result.</li>
            <li>Sign in to seal a reaction test, then mark how it really did.</li>
          </ol>
          <div className="quick-links">
            <a href="/call">
              <strong>Call it</strong>
              <span className="muted">Today's question against the AI's sealed call</span>
            </a>
            <a href="/record">
              <strong>Your record</strong>
              <span className="muted">Engine against your gut on marked tests</span>
            </a>
            <a href="/receipts">
              <strong>Receipts</strong>
              <span className="muted">Every forecast, hashed before its outcome</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

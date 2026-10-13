import { useRef } from "react";
import { BRAND } from "../brand";
import { useViewed } from "../useViewed";

// Three steps, a real sequence (simulate -> hash -> score), written only from
// claims allowed in gtm/messaging.md.
const STEPS = [
  {
    k: "Each morning",
    h: "Simulate",
    p: `${BRAND.name} simulates how the world's population reacts to the day's news, calibrated to published population marginals.`,
  },
  {
    k: "Before the outcome",
    h: "Hash",
    p: "We commit the forecast as a hash before the outcome exists, so the record cannot be backfilled.",
  },
  {
    k: "When it resolves",
    h: "Score",
    p: "We score the forecast in public against the market price and a plain-language-model baseline — misses included.",
  },
];

export function HowItWorks() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "how_it_works");
  return (
    <section ref={viewRef} className="section wrap" aria-labelledby="how-title">
      <h2 className="section-title" id="how-title">
        How it works
      </h2>
      <ol className="steps">
        {STEPS.map((s) => (
          <li key={s.h}>
            <div className="step-k">{s.k}</div>
            <h3>{s.h}</h3>
            <p>{s.p}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { useRef } from "react";
import { useViewed } from "../useViewed";

// Three steps for the first job (decision 0012: "Will this land?"), written only from claims
// allowed in gtm/messaging.md: "Test a post on simulated audiences before you post it", "Your tests
// are sealed when you make them", "A record that cannot be backfilled", and "Every test you seal
// is scored when you mark how it did". Nothing here shows a result, because there is none yet.
const STEPS = [
  {
    k: "Before you post",
    h: "Test",
    p: "Paste a post and pick an audience. We simulate how that audience would react. AI-simulated, not a poll.",
  },
  {
    k: "When you make it",
    h: "Seal",
    p: "Your tests are sealed when you make them, so the record cannot be backfilled.",
  },
  {
    k: "When you know",
    h: "Mark",
    p: "Say how the post did. Every test you seal is scored when you mark how it did.",
  },
];

export function HowItWorks() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "how_it_works");
  return (
    <section ref={viewRef} className="section wrap" aria-labelledby="how-title">
      <h2 className="section-title" id="how-title">
        How a test works
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

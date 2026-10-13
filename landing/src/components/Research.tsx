import { useRef } from "react";
import { RESEARCH } from "../copy/sections";
import { useViewed } from "../useViewed";

export function Research() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "research");
  return (
    <section ref={viewRef} className="section wrap" aria-labelledby="research-title">
      <h2 className="section-title" id="research-title">
        {RESEARCH.title}
      </h2>
      <p className="section-note">{RESEARCH.note}</p>
      <div className="claims">
        <div>
          <h3 className="claims-title">What we say</h3>
          <ul>
            {RESEARCH.say.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="claims-title">What we leave out</h3>
          <ul>
            {RESEARCH.leave.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="caveat">{RESEARCH.caveat}</p>
    </section>
  );
}

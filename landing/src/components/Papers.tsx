import { useRef } from "react";
import { PAPERS } from "../copy/sections";
import { useViewed } from "../useViewed";

export function Papers() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "papers");
  return (
    <section ref={viewRef} className="section wrap" aria-labelledby="papers-title">
      <h2 className="section-title" id="papers-title">
        {PAPERS.title}
      </h2>
      <p className="section-note">{PAPERS.note}</p>
      <dl className="ledger">
        {PAPERS.rows.map((r) => (
          <div className="ledger-row" key={r.term}>
            <dt>{r.term}</dt>
            <dd>
              {r.text}{" "}
              <a className="link" href={r.href} rel="noopener noreferrer" target="_blank">
                {r.cite}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

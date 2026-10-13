import { useRef } from "react";
import { USE_CASES } from "../copy/sections";
import { useViewed } from "../useViewed";
import { Ledger } from "./Ledger";

export function UseCases() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "use_cases");
  return (
    <section ref={viewRef} className="section wrap" aria-labelledby="use-title">
      <h2 className="section-title" id="use-title">
        {USE_CASES.title}
      </h2>
      <p className="section-note">{USE_CASES.note}</p>
      <Ledger rows={USE_CASES.rows} />
    </section>
  );
}

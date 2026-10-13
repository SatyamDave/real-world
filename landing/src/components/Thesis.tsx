import { useRef } from "react";
import { THESIS } from "../copy/sections";
import { useViewed } from "../useViewed";
import { Ledger } from "./Ledger";

export function Thesis() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "thesis");
  return (
    <section ref={viewRef} className="section wrap thesis" aria-labelledby="thesis-title">
      <h2 id="thesis-title" className="thesis-statement">
        {THESIS.statement}
      </h2>
      <Ledger rows={THESIS.rows} />
    </section>
  );
}

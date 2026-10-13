import type { LedgerRow } from "../copy/sections";

// A printed-ledger list: a term on the left, its line on the right, ruled in ink like the
// receipt cards above it. It is a definition list because that is what it is.
export function Ledger({ rows }: { rows: LedgerRow[] }) {
  return (
    <dl className="ledger">
      {rows.map((r) => (
        <div className="ledger-row" key={r.term}>
          <dt>{r.term}</dt>
          <dd>{r.text}</dd>
        </div>
      ))}
    </dl>
  );
}

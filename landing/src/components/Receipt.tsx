import type { ReactNode } from "react";
import type receiptsData from "../data/receipts.json";

export type ReceiptData = (typeof receiptsData.receipts)[number];

/**
 * One forecast slip, pending state only: no hash, probability or score appears until the
 * ledger publishes. The strip under the hero and the card a globe marker opens are both this
 * component, so there is one receipt anatomy on the page (product/design.md).
 */
export function Receipt({
  receipt,
  headingLevel = 3,
  children,
}: {
  receipt: ReceiptData;
  headingLevel?: 2 | 3;
  children?: ReactNode;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="receipt">
      <div className="top">
        <span>Receipt</span>
        <span className="stamp">Pending</span>
      </div>
      <Heading className="q">{receipt.question}</Heading>
      <dl className="cols">
        <div>
          <dt>Committed</dt>
          <dd className="pending">{receipt.status}</dd>
        </div>
        <div>
          <dt>Resolves</dt>
          <dd>
            {receipt.resolvesOn}
            <span className="src">{receipt.source}</span>
          </dd>
        </div>
      </dl>
      {children}
      <p className="foot">AI-simulated. Not a poll.</p>
    </article>
  );
}

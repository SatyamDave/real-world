import { BRAND } from "../brand";
import receiptsData from "../data/receipts.json";

const receipts = receiptsData.receipts;

// The first receipts. Pending state only: no hash and no probability appear
// until the ledger publishes. See product/landing-page.md and data note 059.
export function ReceiptsPreview() {
  return (
    <section className="section wrap" aria-labelledby="receipts-title">
      <h2 className="section-title" id="receipts-title">
        The first receipts.
      </h2>
      <p className="section-note">
        These are the events {BRAND.name} will forecast first. No hashes or probabilities are shown
        here yet — the record starts when the first forecast is hashed.
      </p>
      <div className="receipts">
        {receipts.map((r) => (
          <article className="receipt" key={r.id}>
            <div className="top">
              <span>RECEIPT · pre-launch</span>
              <span className="stamp">PENDING</span>
            </div>
            <div className="body">
              <p className="q">{r.question}</p>
              <div className="kv">
                <span className="k">commit</span>
                <span className="v" style={{ color: "var(--accent-2)" }}>
                  {r.status}
                </span>
                <span className="k">resolves</span>
                <span className="v">
                  {r.resolvesOn} · {r.source}
                </span>
                <span className="k">market</span>
                <span className="v" style={{ color: "var(--accent-2)" }}>
                  shown at commit
                </span>
              </div>
            </div>
            <div className="foot">
              <span className="disc" aria-hidden="true" />
              AI-simulated · not a poll
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

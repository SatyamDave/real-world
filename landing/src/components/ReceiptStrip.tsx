import { useEffect, useRef, useState } from "react";
import { BRAND } from "../brand";
import receiptsData from "../data/receipts.json";
import { useViewed } from "../useViewed";
import { Receipt } from "./Receipt";

const receipts = receiptsData.receipts;

// The credibility device: a strip of forecast cards where competitors put client
// logos. Pending state only: no hash, probability or score appears until the
// ledger publishes. See product/landing-page.md and data note 059.
export function ReceiptStrip() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "receipts");
  // On a phone the cards scroll sideways. A scroll region with nothing focusable
  // inside must be focusable itself (WCAG 2.1.1); on desktop it does not scroll,
  // so it stays out of the tab order.
  const scroller = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <section
      ref={viewRef}
      className="section strip wrap"
      id="receipts"
      aria-labelledby="receipts-title"
    >
      <h2 className="section-title" id="receipts-title">
        The first receipts.
      </h2>
      <p className="section-note">
        These are the events {BRAND.name} will forecast first. No hashes or probabilities are shown
        here yet. The record starts when the first forecast is hashed.
      </p>
      <div
        className="receipts-scroll"
        ref={scroller}
        {...(scrolls
          ? { tabIndex: 0, role: "region", "aria-label": "First receipts. Scroll sideways." }
          : {})}
      >
        <ul className="receipts">
          {receipts.map((r) => (
            <li className="receipt-wrap" key={r.id}>
              <Receipt receipt={r} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

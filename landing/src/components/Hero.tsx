import { useEffect, useState } from "react";
import { appDeepLink, track } from "../analytics";
import { config, hasAppUrl } from "../config";
import type { Headline } from "../copy/headlines";
import receiptsData from "../data/receipts.json";
import { Globe, type GlobePhase } from "./Globe";
import { SignupForm } from "./SignupForm";

const receipts = receiptsData.receipts;

export function Hero({ headline }: { headline: Headline }) {
  // The chips appear as their marker pulses. Until the globe says which mode it
  // is in they wait; if it never says (slow network), they show after 3s.
  const [phase, setPhase] = useState<GlobePhase | "pending">("pending");
  useEffect(() => {
    const t = window.setTimeout(() => setPhase((p) => (p === "pending" ? "static" : p)), 3000);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <section className="hero wrap">
      <div className="hero-copy">
        <p className="eyebrow">A daily, public, scored forecast of the world. Launching Oct 27.</p>
        <h1>{headline.h1}</h1>
        <p className="sub">{headline.sub}</p>
        <p className="contrast">No accuracy claim. Read the receipts.</p>
        <SignupForm
          location="hero"
          secondary={
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                track("cta_clicked", { location: "hero_secondary" });
                document.getElementById("receipts")?.scrollIntoView({ block: "start" });
              }}
            >
              See the receipts
            </button>
          }
        />
        {hasAppUrl ? (
          <a
            className="try-link"
            href={appDeepLink(config.appUrl)}
            onClick={() => track("app_link_clicked", { location: "hero" })}
          >
            Try today's question
          </a>
        ) : null}
      </div>
      <div className="stage" data-phase={phase}>
        <Globe
          markers={receipts.map((r) => r.marker)}
          onPhase={(next) => setPhase((p) => (p === "pending" ? next : p))}
        />
        <div className="chip chip-1" aria-hidden="true">
          <div className="q">{shortLabel(receipts[0])}</div>
          <div className="m">
            <span className="pending">Pending</span> <span>resolves {receipts[0].resolvesOn}</span>
          </div>
        </div>
        <div className="chip chip-2" aria-hidden="true">
          <div className="q">{shortLabel(receipts[1])}</div>
          <div className="m">
            <span className="pending">Pending</span> <span>resolves {receipts[1].resolvesOn}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// A short marker label for the anchored chips (the full question is in the
// receipt strip). No hash or probability is shown.
function shortLabel(r: { question: string }): string {
  if (r.question.includes("Federal Reserve")) return "US Fed rate decision";
  if (r.question.includes("European Central Bank")) return "ECB rate decision";
  if (r.question.includes("Bank of Japan")) return "Bank of Japan rate decision";
  if (r.question.includes("Brazilian")) return "Brazil presidential runoff";
  return r.question.slice(0, 40);
}

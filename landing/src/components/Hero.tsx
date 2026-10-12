import { appDeepLink, track } from "../analytics";
import { config, hasAppUrl } from "../config";
import type { Headline } from "../copy/headlines";
import receiptsData from "../data/receipts.json";
import { Globe } from "./Globe";
import { SignupForm } from "./SignupForm";

const receipts = receiptsData.receipts;

export function Hero({ headline }: { headline: Headline }) {
  return (
    <section className="hero wrap">
      <div className="hero-copy">
        <p className="eyebrow">A daily, public, scored forecast of the world — launching Oct 27.</p>
        <h1>{headline.h1}</h1>
        <p className="sub">{headline.sub}</p>
        <SignupForm location="hero" />
        {hasAppUrl ? (
          <a
            className="try-link"
            href={appDeepLink(config.appUrl)}
            onClick={() => track("app_link_clicked", { location: "hero" })}
          >
            Try today's question →
          </a>
        ) : null}
      </div>
      <div className="stage">
        <Globe markers={receipts.map((r) => r.marker)} />
        <article className="chip chip-1">
          <div className="q">{shortLabel(receipts[0])}</div>
          <div className="m">
            resolves {receipts[0].resolvesOn} · <span className="pending">hash pending</span>
          </div>
        </article>
        <article className="chip chip-2">
          <div className="q">{shortLabel(receipts[1])}</div>
          <div className="m">
            resolves {receipts[1].resolvesOn} · <span className="pending">hash pending</span>
          </div>
        </article>
      </div>
    </section>
  );
}

// A short marker label for the anchored chips (the full question is in the
// receipts section). No hash or probability is shown.
function shortLabel(r: { question: string }): string {
  if (r.question.includes("Federal Reserve")) return "US Fed rate decision";
  if (r.question.includes("European Central Bank")) return "ECB rate decision";
  if (r.question.includes("Bank of Japan")) return "Bank of Japan rate decision";
  if (r.question.includes("Brazilian")) return "Brazil presidential runoff";
  return r.question.slice(0, 40);
}

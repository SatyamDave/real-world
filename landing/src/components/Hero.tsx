import { useRef } from "react";
import { appDeepLink, track } from "../analytics";
import { config, hasAppUrl } from "../config";
import type { Headline } from "../copy/headlines";
import receiptsData from "../data/receipts.json";
import { useViewed } from "../useViewed";
import { Globe } from "./Globe";
import { SignupForm } from "./SignupForm";

const receipts = receiptsData.receipts;

// The hero: the headline, one lead, the field and one action; the globe beside it (above it on a
// phone) is the way into the questions. Everything else the page says is lower down.
export function Hero({
  headline,
  onJoin,
}: {
  headline: Headline;
  onJoin: (location: string) => void;
}) {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "hero");
  return (
    <section ref={viewRef} className="hero wrap">
      <div className="hero-copy">
        <h1>{headline.h1}</h1>
        <p className="lead">{headline.sub}</p>
        <SignupForm
          location="hero"
          secondary={
            <button
              type="button"
              className="link"
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
      <Globe receipts={receipts} onJoin={onJoin} />
    </section>
  );
}

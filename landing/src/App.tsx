import { useEffect, useRef } from "react";
import { track } from "./analytics";
import { BRAND } from "./brand";
import { Collaborate } from "./components/Collaborate";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { ReceiptStrip } from "./components/ReceiptStrip";
import { Research } from "./components/Research";
import { Thesis } from "./components/Thesis";
import { UseCases } from "./components/UseCases";
import type { Headline } from "./copy/headlines";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { useViewed } from "./useViewed";

export function App({ headline, path = "/" }: { headline: Headline; path?: string }) {
  if (path === "/privacy") return <LegalShell>{<Privacy />}</LegalShell>;
  if (path === "/terms") return <LegalShell>{<Terms />}</LegalShell>;
  return <Home headline={headline} />;
}

function focusEmail(location: string) {
  track("cta_clicked", { location });
  const input = document.getElementById("email") as HTMLInputElement | null;
  input?.scrollIntoView({ block: "center" });
  input?.focus({ preventScroll: true });
}

function SiteHeader({ cta = false }: { cta?: boolean }) {
  return (
    <header className="site-header wrap">
      <div className="brand">
        {BRAND.name}
        <span className="brand-dot" aria-hidden="true">
          .
        </span>
      </div>
      {cta ? (
        <button type="button" className="btn btn-small" onClick={() => focusEmail("header")}>
          Join the waitlist
        </button>
      ) : null}
    </header>
  );
}

function Home({ headline }: { headline: Headline }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader cta />
      <main id="main">
        <Hero headline={headline} />
        <ReceiptStrip />
        <Thesis />
        <HowItWorks />
        <UseCases />
        <Research />
        <Collaborate onJoin={() => focusEmail("collaborate")} />
        <RepeatCta />
      </main>
      <Footer />
    </>
  );
}

function RepeatCta() {
  const viewRef = useRef<HTMLElement>(null);
  useViewed(viewRef, "repeat_cta");
  return (
    <section className="cta-band wrap" ref={viewRef}>
      <h2>Watch the record start.</h2>
      <button type="button" className="btn" onClick={() => focusEmail("repeat")}>
        Join the waitlist
      </button>
    </section>
  );
}

function LegalShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    track("section_viewed", { section: "legal" });
  }, []);
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap legal-main">
        {children}
      </main>
      <Footer />
    </>
  );
}

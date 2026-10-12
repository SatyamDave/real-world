import { useEffect } from "react";
import { track } from "./analytics";
import { BRAND } from "./brand";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { ReceiptsPreview } from "./components/ReceiptsPreview";
import type { Headline } from "./copy/headlines";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

export function App({ headline, path = "/" }: { headline: Headline; path?: string }) {
  if (path === "/privacy") return <LegalShell>{<Privacy />}</LegalShell>;
  if (path === "/terms") return <LegalShell>{<Terms />}</LegalShell>;
  return <Home headline={headline} />;
}

function SiteHeader() {
  return (
    <header className="site-header wrap">
      <div className="brand">
        {BRAND.name}
        <span className="brand-dot" aria-hidden="true">
          .
        </span>
      </div>
      <div className="tagline">{BRAND.tagline}</div>
    </header>
  );
}

function Home({ headline }: { headline: Headline }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero headline={headline} />
        <HowItWorks />
        <ReceiptsPreview />
        <RepeatCta />
      </main>
      <Footer />
    </>
  );
}

function RepeatCta() {
  return (
    <section className="cta-band wrap">
      <h2>Watch the record start.</h2>
      <button
        type="button"
        className="btn"
        onClick={() => {
          track("cta_clicked", { location: "repeat" });
          const input = document.getElementById("email") as HTMLInputElement | null;
          input?.focus();
          input?.scrollIntoView({ block: "center" });
        }}
      >
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
      <main id="main" className="wrap" style={{ padding: "32px 24px 64px", maxWidth: 760 }}>
        {children}
      </main>
      <Footer />
    </>
  );
}

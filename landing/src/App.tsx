import { useEffect, useRef, useState } from "react";
import { track } from "./analytics";
import { BRAND } from "./brand";
import { Collaborate } from "./components/Collaborate";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { ReceiptStrip } from "./components/ReceiptStrip";
import { Research } from "./components/Research";
import { Thesis } from "./components/Thesis";
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
  // The header's button appears only once the hero's own field has scrolled out of view, so the
  // first screen has one action, not two. Until then the bar says when the record starts.
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (!cta) return;
    const field = document.querySelector(".hero .signup");
    if (!field || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(field);
    return () => io.disconnect();
  }, [cta]);
  return (
    <header className="topbar" data-section="header">
      <div className="wrap topbar-in">
        <a className="brand" href="/">
          {BRAND.name}
          <span className="brand-dot" aria-hidden="true">
            .
          </span>
        </a>
        {cta && away ? (
          <button type="button" className="btn btn-small" onClick={() => focusEmail("header")}>
            Join the waitlist
          </button>
        ) : cta ? (
          <span className="topbar-note">Launching Oct 27</span>
        ) : null}
      </div>
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
        <Hero headline={headline} onJoin={focusEmail} />
        <HowItWorks />
        <ReceiptStrip />
        <Thesis />
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

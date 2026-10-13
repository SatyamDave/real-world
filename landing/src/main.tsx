import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initAfterPaint, setConsented, setHeadlineVariant, track } from "./analytics";
import { CookieNotice, storedConsent } from "./components/CookieNotice";
import { resolveHeadline } from "./copy/headlines";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";

// Message match: pick the headline from utm_content, fall back to the default.
const params = new URLSearchParams(window.location.search);
const headline = resolveHeadline(params.get("utm_content"));
setHeadlineVariant(headline.id);
setConsented(storedConsent() === "accepted");

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

createRoot(root).render(
  <StrictMode>
    <App headline={headline} path={window.location.pathname} />
    <CookieNotice />
  </StrictMode>,
);

track("landing_viewed", {
  path: window.location.pathname,
  referrer: document.referrer,
  ...Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((k) => [k, params.get(k)] as const)
      .filter(([, v]) => v),
  ),
});
initAfterPaint();

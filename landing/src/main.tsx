import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { initAfterPaint, setHeadlineVariant, track } from "./analytics";
import { resolveHeadline } from "./copy/headlines";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";

// Message match: pick the headline from utm_content, fall back to the default.
const params = new URLSearchParams(window.location.search);
const headline = resolveHeadline(params.get("utm_content"));
setHeadlineVariant(headline.id);

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

const app = (
  <StrictMode>
    <App headline={headline} path={window.location.pathname} />
  </StrictMode>
);
// The build pre-renders the home page into index.html (scripts/prerender.mjs); hydrate it when
// it is there, and render from scratch on the other routes and in dev.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

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

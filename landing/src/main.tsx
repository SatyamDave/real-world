import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { setHeadlineVariant, track } from "./analytics";
import { resolveHeadline } from "./copy/headlines";
import "./styles/tokens.css";
import "./styles/global.css";

// Message match: pick the headline from utm_content, fall back to the default.
const params = new URLSearchParams(window.location.search);
const headline = resolveHeadline(params.get("utm_content"));
setHeadlineVariant(headline.id);

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

createRoot(root).render(
  <StrictMode>
    <App headline={headline} path={window.location.pathname} />
  </StrictMode>,
);

track("landing_viewed", { path: window.location.pathname });

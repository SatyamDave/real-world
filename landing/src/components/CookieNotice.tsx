import { useState } from "react";
import { initAnalytics, setConsented } from "../analytics";

const KEY = "rw_analytics_consent";

export function storedConsent(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function store(value: "accepted" | "declined") {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Without storage the choice lasts for this page view only.
  }
}

export function CookieNotice() {
  const [open, setOpen] = useState(() => storedConsent() === null);
  if (!open) return null;
  const choose = (value: "accepted" | "declined") => {
    store(value);
    setOpen(false);
    setConsented(value === "accepted");
    if (value === "accepted") void initAnalytics();
  };
  return (
    <section className="cookie-notice" aria-label="Cookies">
      <p>
        With your consent we count visits and clicks with Amplitude, Reddit and X cookies. Nothing
        is sent unless you accept. <a href="/privacy">Privacy</a>
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn-secondary" onClick={() => choose("declined")}>
          Decline
        </button>
        <button type="button" className="btn btn-small" onClick={() => choose("accepted")}>
          Accept
        </button>
      </div>
    </section>
  );
}

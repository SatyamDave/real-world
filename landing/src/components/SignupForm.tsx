import { useState } from "react";
import { appDeepLink, getDeviceId, getHeadlineVariant, track } from "../analytics";
import { BRAND } from "../brand";
import { config, hasAppUrl } from "../config";
import { CONSENT_TEXT, CONSENT_VERSION } from "../copy/consent";
import { TypeformSlot } from "./TypeformSlot";
import { useTurnstile } from "./useTurnstile";

// A lenient client-side email check; the server (PR3) is the real validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignupInput {
  email: string;
  utm: Record<string, string>;
  referrer: string;
  landingPath: string;
  consentVersion: string;
  deviceId: string | null;
  headlineVariant: string;
  turnstileToken: string | null;
}
export interface SignupResult {
  signupId: string;
  duplicate: boolean;
}
export type SubmitFn = (input: SignupInput) => Promise<SignupResult>;

type State =
  | { kind: "idle" }
  | { kind: "invalid" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "duplicate"; result: SignupResult }
  | { kind: "success"; result: SignupResult };

function collectUtm(): Record<string, string> {
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = p.get(k);
    if (v) out[k] = v;
  }
  return out;
}

// Default submit: POST to the signup Pages Function.
const defaultSubmit: SubmitFn = async (input) => {
  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok && res.status !== 409) throw new Error(`signup failed: ${res.status}`);
  const data = (await res.json()) as { signup_id: string; duplicate?: boolean };
  return { signupId: data.signup_id, duplicate: Boolean(data.duplicate) };
};

export function SignupForm({
  location,
  submit = defaultSubmit,
}: {
  location: string;
  submit?: SubmitFn;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const turnstile = useTurnstile(config.turnstileSiteKey);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    track("cta_clicked", { location });
    if (!EMAIL_RE.test(email.trim())) {
      setState({ kind: "invalid" });
      return;
    }
    setState({ kind: "loading" });
    track("email_submitted", { location });
    try {
      const result = await submit({
        email: email.trim(),
        utm: collectUtm(),
        referrer: document.referrer,
        landingPath: window.location.pathname,
        consentVersion: CONSENT_VERSION,
        deviceId: getDeviceId(),
        headlineVariant: getHeadlineVariant(),
        turnstileToken: turnstile.token(),
      });
      turnstile.reset();
      setState(result.duplicate ? { kind: "duplicate", result } : { kind: "success", result });
    } catch {
      turnstile.reset();
      setState({ kind: "error" });
      track("signup_failed", { location, reason: "request_failed" });
    }
  }

  if (state.kind === "success" || state.kind === "duplicate") {
    const dup = state.kind === "duplicate";
    return (
      <div className={dup ? "signup-dup" : "signup-success"}>
        <h2>{dup ? "You're already on the list." : "You're in."}</h2>
        <p>
          {dup
            ? "We've got this email. Answer the teaser question below to finish."
            : `One quick question while you're here — it's the kind ${BRAND.name} scores every day.`}
        </p>
        <TypeformSlot signupId={state.result.signupId} deviceId={getDeviceId()} />
        {hasAppUrl ? (
          <a
            className="try-link"
            href={appDeepLink(config.appUrl)}
            onClick={() => track("app_link_clicked", { location: "success" })}
          >
            Try today's question →
          </a>
        ) : null}
      </div>
    );
  }

  const loading = state.kind === "loading";
  return (
    <form className="signup" onSubmit={onSubmit} noValidate>
      <label htmlFor="email" style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
        Get the first receipts in your inbox.
      </label>
      <div className="row">
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          aria-label="Email address"
          aria-invalid={state.kind === "invalid"}
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Join the waitlist"}
        </button>
      </div>
      {state.kind === "invalid" ? (
        <p className="field-msg error" role="alert">
          Enter an email address like you@email.com.
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="field-msg error" role="alert">
          That didn't save — check your connection and try again.
        </p>
      ) : null}
      <p className="consent">{CONSENT_TEXT}</p>
      {config.turnstileSiteKey ? (
        <>
          <div ref={turnstile.ref} />
          <p className="turnstile-note">Protected by a bot check.</p>
        </>
      ) : null}
    </form>
  );
}

import { useEffect, useRef, useState } from "react";
import { appDeepLink, getDeviceId, getHeadlineVariant, track } from "../analytics";
import { BRAND } from "../brand";
import { config, hasAppUrl } from "../config";
import { CONSENT_TEXT, CONSENT_VERSION } from "../copy/consent";
import { TallySlot } from "./TallySlot";
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
// Why a submit failed, so the form can say what to do next.
export type FailReason = "request_failed" | "bot_check" | "rate_limited";
export class SignupError extends Error {
  constructor(readonly reason: FailReason) {
    super(reason);
  }
}
export type SubmitFn = (input: SignupInput) => Promise<SignupResult>;

type State =
  | { kind: "idle" }
  | { kind: "invalid" }
  | { kind: "loading" }
  | { kind: "error"; reason: FailReason }
  | { kind: "duplicate"; result: SignupResult }
  | { kind: "success"; result: SignupResult };

const ERROR_COPY: Record<FailReason, string> = {
  request_failed: "That didn't save. Check your connection and try again.",
  bot_check: "We couldn't confirm you're human. Reload the page and try again.",
  rate_limited: "Too many tries from this device. Wait a few minutes and try again.",
};

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
  if (res.status === 429) throw new SignupError("rate_limited");
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new SignupError(body.error === "bot_check_failed" ? "bot_check" : "request_failed");
  }
  if (!res.ok && res.status !== 409) throw new SignupError("request_failed");
  const data = (await res.json()) as { signup_id: string; duplicate?: boolean };
  return { signupId: data.signup_id, duplicate: Boolean(data.duplicate) };
};

export function SignupForm({
  location,
  submit = defaultSubmit,
  secondary = null,
}: {
  location: string;
  submit?: SubmitFn;
  secondary?: React.ReactNode;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const turnstile = useTurnstile(config.turnstileSiteKey);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const done = state.kind === "success" || state.kind === "duplicate";
  // The form unmounts on success; move focus to the result so keyboard and screen reader users land on it.
  useEffect(() => {
    if (done) doneHeading.current?.focus();
  }, [done]);

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
        turnstileToken: await turnstile.waitForToken(),
      });
      turnstile.dispose(); // the form is about to be replaced; remove the widget first
      setState(result.duplicate ? { kind: "duplicate", result } : { kind: "success", result });
      // A new signup is the one conversion (the pixels' Lead). A duplicate is not.
      track(result.duplicate ? "signup_duplicate" : "signup_saved", {
        location,
        signup_id: result.signupId,
      });
    } catch (err) {
      turnstile.reset();
      const reason = err instanceof SignupError ? err.reason : "request_failed";
      setState({ kind: "error", reason });
      track("signup_failed", { location, reason });
    }
  }

  if (state.kind === "success" || state.kind === "duplicate") {
    const dup = state.kind === "duplicate";
    return (
      <div className={dup ? "signup-dup" : "signup-success"}>
        <h2 ref={doneHeading} tabIndex={-1}>
          {dup ? "You're already on the list." : "You're in."}
        </h2>
        <p>
          {dup
            ? "We've got this email. Answer the teaser question below to finish."
            : `One quick question while you're here — it's the kind ${BRAND.name} scores every day.`}
        </p>
        <TallySlot signupId={state.result.signupId} deviceId={getDeviceId()} />
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
          className="amp-mask"
          type="email"
          inputMode="email"
          autoComplete="email"
          onFocus={turnstile.arm}
          placeholder="you@email.com"
          aria-label="Email address"
          aria-invalid={state.kind === "invalid" || state.kind === "error"}
          aria-describedby={
            state.kind === "invalid" || state.kind === "error" ? "email-msg" : undefined
          }
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Join the waitlist"}
          </button>
          {secondary}
        </div>
      </div>
      {state.kind === "invalid" ? (
        <p className="field-msg error" role="alert" id="email-msg">
          Enter an email address like you@email.com.
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="field-msg error" role="alert" id="email-msg">
          {ERROR_COPY[state.reason]}
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

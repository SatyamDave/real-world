import { useEffect } from "react";
import { getHeadlineVariant, track } from "../analytics";
import { BRAND } from "../brand";
import { config } from "../config";

// The question id saved with the answer; matches the form's hidden field.
const QUESTION_ID = "fed-2026-10-28";
const TALLY = "https://tally.so";
const formId = config.tallyFormId;

/** The embed URL for a form, with the hidden fields that join the answers to the signup. */
export function tallyEmbedUrl(
  formId: string,
  fields: { signupId: string; deviceId: string | null; variant: string },
): string {
  const u = new URL(`${TALLY}/embed/${encodeURIComponent(formId)}`);
  u.searchParams.set("hideTitle", "1");
  u.searchParams.set("transparentBackground", "1");
  u.searchParams.set("signup_id", fields.signupId);
  u.searchParams.set("device_id", fields.deviceId ?? "");
  u.searchParams.set("variant", fields.variant);
  u.searchParams.set("question_id", QUESTION_ID);
  return u.toString();
}

/** True for the message Tally's embed posts when the form is submitted. */
export function isTallySubmit(origin: string, data: unknown): boolean {
  if (origin !== TALLY) return false;
  const name = typeof data === "string" ? data : (data as { event?: unknown } | null)?.event;
  return typeof name === "string" && name.includes("Tally.FormSubmitted");
}

/**
 * The embedded Tally form (teaser forecast and role), shown after the email row is saved.
 * signup_id, device_id, variant and question_id go in as hidden fields so the webhook can
 * join the answers to the signup. A plain iframe, so no third-party script runs on our
 * origin. Without a form id configured it shows the teaser question as plain text, so the
 * success state still works.
 */
export function TallySlot({
  signupId,
  deviceId = null,
}: {
  signupId: string;
  deviceId?: string | null;
}) {
  useEffect(() => {
    track("form_opened", { signup_id: signupId });
  }, [signupId]);

  useEffect(() => {
    if (!formId) return;
    const onMessage = (e: MessageEvent) => {
      if (isTallySubmit(e.origin, e.data)) track("form_submitted", { signup_id: signupId });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [signupId]);

  if (formId) {
    return (
      <section
        className="form-embed"
        aria-label="Teaser forecast and role"
        data-signup-id={signupId}
      >
        <iframe
          title="Teaser forecast and role"
          src={tallyEmbedUrl(formId, { signupId, deviceId, variant: getHeadlineVariant() })}
        />
      </section>
    );
  }
  return (
    <div className="form-embed form-embed-text" data-signup-id={signupId}>
      <p className="form-embed-q">{BRAND.teaser.question}</p>
      <p className="form-embed-note">
        Drag to give your forecast from 0 to 100. We'll score it against the simulated world and the
        market when it resolves on {BRAND.teaser.resolvesOn} ({BRAND.teaser.resolutionSource}).
      </p>
    </div>
  );
}

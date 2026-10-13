import { useEffect, useRef } from "react";
import { getHeadlineVariant, track } from "../analytics";
import { BRAND } from "../brand";
import { config } from "../config";

// The question id stored with the answer; matches the form's hidden field.
const QUESTION_ID = "fed-2026-10-28";

/**
 * The embedded Typeform (teaser forecast + role), opened after the email row is
 * saved. signup_id, device_id, variant and question_id go in as hidden fields so
 * the webhook can join the answers to the signup. Without a form id configured
 * it shows the teaser question as plain text, so the success state still works.
 */
export function TypeformSlot({
  signupId,
  deviceId = null,
}: {
  signupId: string;
  deviceId?: string | null;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const formId = config.typeformFormId;

  useEffect(() => {
    track("typeform_opened", { signup_id: signupId });
    if (!formId || !mount.current) return;
    let cancelled = false;
    let widget: { unmount?: () => void } | undefined;
    // Loaded on demand so the embed never touches the first paint.
    Promise.all([import("@typeform/embed"), import("@typeform/embed/build/css/widget.css")]).then(
      ([{ createWidget }]) => {
        if (cancelled || !mount.current) return;
        widget = createWidget(formId, {
          container: mount.current,
          hidden: {
            signup_id: signupId,
            device_id: deviceId ?? "",
            variant: getHeadlineVariant(),
            question_id: QUESTION_ID,
          },
          onSubmit: () => track("typeform_submitted", { signup_id: signupId }),
        });
      },
    );
    return () => {
      cancelled = true;
      widget?.unmount?.();
    };
  }, [signupId, deviceId]);

  if (formId) {
    return (
      <section
        className="typeform-embed"
        ref={mount}
        aria-label="Teaser forecast and role"
        data-signup-id={signupId}
        style={{ height: 420 }}
      ></section>
    );
  }
  return (
    <div className="typeform-embed" data-signup-id={signupId} style={{ padding: 18 }}>
      <p style={{ fontWeight: 500, marginBottom: 8 }}>{BRAND.teaser.question}</p>
      <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
        Drag to give your forecast from 0 to 100. We'll score it against the simulated world and the
        market when it resolves on {BRAND.teaser.resolvesOn} ({BRAND.teaser.resolutionSource}).
      </p>
    </div>
  );
}

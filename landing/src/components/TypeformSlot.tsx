import { useEffect } from "react";
import { track } from "../analytics";
import { BRAND } from "../brand";

/**
 * Where the embedded Typeform (teaser forecast + role) mounts after email
 * success. PR3 replaces the placeholder body with @typeform/embed, passing
 * signup_id, device_id and variant as URL parameters and firing
 * typeform_opened / typeform_submitted. For now it shows the teaser question so
 * the success state is complete and testable.
 */
export function TypeformSlot({ signupId }: { signupId: string }) {
  useEffect(() => {
    track("typeform_opened", { signup_id: signupId });
  }, [signupId]);

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

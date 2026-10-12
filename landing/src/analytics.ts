// Thin analytics wrapper. PR2 ships the surface and a console sink; PR4 wires
// Amplitude (browser SDK, autocapture, session replay) and the Reddit/X pixels
// behind this same track() call. Every event carries headline_variant.
// See landing/analytics/TRACKING_PLAN.md (added in PR4).

let headlineVariant = "unknown";

export function setHeadlineVariant(variant: string): void {
  headlineVariant = variant;
}

export function getHeadlineVariant(): string {
  return headlineVariant;
}

export type EventName =
  | "landing_viewed"
  | "globe_ready"
  | "globe_fallback_shown"
  | "cta_clicked"
  | "email_submitted"
  | "signup_failed"
  | "typeform_opened"
  | "typeform_submitted"
  | "section_viewed"
  | "app_link_clicked"
  | "outbound_clicked";

export function track(name: EventName, props: Record<string, unknown> = {}): void {
  const payload = { headline_variant: headlineVariant, ...props };
  // PR4 replaces this sink with Amplitude + pixel fan-out.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[track]", name, payload);
  }
}

// Amplitude device id, used to continue the funnel into the v1 app. Null until
// PR4 initialises Amplitude; callers omit the link parameter when it is null.
export function getDeviceId(): string | null {
  return null;
}

// Build a link into the v1 app that carries the Amplitude device id, so the
// funnel continues across domains. PR4 sets the exact cross-domain parameter
// name from the current Amplitude docs; until a device id exists this returns
// the base URL unchanged.
export function appDeepLink(base: string): string {
  const id = getDeviceId();
  if (!base || !id) return base;
  try {
    const u = new URL(base);
    u.searchParams.set("ampDeviceId", id); // PR4: confirm the param name in Amplitude docs
    return u.toString();
  } catch {
    return base;
  }
}

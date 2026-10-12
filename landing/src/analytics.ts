// One track() wrapper for the whole page. Every event carries headline_variant
// and goes to Amplitude, and a saved signup also goes to the Reddit and X pixels.
// The SDKs load after first paint (initAnalytics), so events fired earlier wait
// in a queue and are replayed in order. With a Global Privacy Control or
// Do Not Track signal nothing loads and nothing is sent. Event list and
// properties: landing/analytics/TRACKING_PLAN.md.
import { config } from "./config";

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
  | "signup_saved"
  | "signup_duplicate"
  | "signup_failed"
  | "typeform_opened"
  | "typeform_submitted"
  | "section_viewed"
  | "app_link_clicked"
  | "outbound_clicked";

type Sink = (name: string, props: Record<string, unknown>) => void;
interface Queued {
  name: string;
  props: Record<string, unknown>;
}

export interface Loaders {
  amplitude: () => Promise<typeof import("./amplitude")>;
  pixels: () => Promise<typeof import("./pixels")>;
}
export interface AnalyticsConfig {
  amplitudeKey: string;
  replaySampleRate: number;
  redditPixelId: string;
  xPixelId: string;
  xLeadEventId: string;
}

const defaultLoaders: Loaders = {
  amplitude: () => import("./amplitude"),
  pixels: () => import("./pixels"),
};

let queue: Queued[] = [];
let sink: Sink | null = null;
let deviceId: string | null = null;
let enabled = true;
let leadSender: ((eventId: string) => void) | null = null;

/** True when the visitor signals they do not want to be tracked. */
export function privacySignal(nav: Navigator & { globalPrivacyControl?: boolean }): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

export function track(name: EventName, props: Record<string, unknown> = {}): void {
  if (!enabled) return;
  const payload = { headline_variant: headlineVariant, ...props };
  if (import.meta.env.DEV) {
    console.debug("[track]", name, payload);
  }
  if (sink) sink(name, payload);
  else queue.push({ name, props: payload });
  if (name === "signup_saved" && typeof props.signup_id === "string") leadSender?.(props.signup_id);
}

/** Start the SDKs. Safe to call once, after first paint. */
export async function initAnalytics(
  cfg: AnalyticsConfig = config,
  loaders: Loaders = defaultLoaders,
  nav: Navigator = navigator,
): Promise<void> {
  if (privacySignal(nav)) {
    enabled = false;
    queue = [];
    return;
  }
  const wantsPixels = Boolean(cfg.redditPixelId || cfg.xPixelId);
  const jobs: Promise<void>[] = [];

  if (cfg.amplitudeKey) {
    jobs.push(
      loaders
        .amplitude()
        .then((m) =>
          m.start({
            apiKey: cfg.amplitudeKey,
            replaySampleRate: cfg.replaySampleRate,
            headlineVariant,
          }),
        )
        .then((started) => {
          deviceId = started.deviceId ?? null;
          sink = started.track;
          for (const e of queue) sink(e.name, e.props);
          queue = [];
        })
        .catch(() => {
          // Analytics must never break the page. Drop the queue and stop queueing.
          queue = [];
          sink = () => {};
        }),
    );
  } else {
    queue = [];
    sink = () => {};
  }

  if (wantsPixels) {
    jobs.push(
      loaders
        .pixels()
        .then((p) => {
          if (cfg.redditPixelId) p.loadReddit(cfg.redditPixelId);
          if (cfg.xPixelId) p.loadX(cfg.xPixelId);
          leadSender = (eventId) => p.sendLead(eventId, cfg.xLeadEventId);
        })
        .catch(() => {}),
    );
  }
  await Promise.all(jobs);
}

/** Run initAnalytics once the page has painted and the browser is idle. */
export function initAfterPaint(): void {
  const go = () => void initAnalytics();
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  const start = () => (idle ? idle(go) : window.setTimeout(go, 1));
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

// Amplitude device id, used to continue the funnel into the v1 app. Null until
// the SDK has started; callers omit the link parameter when it is null.
export function getDeviceId(): string | null {
  return deviceId;
}

// Build a link into the v1 app that carries the Amplitude device id, so the
// funnel continues across domains. ampDeviceId is the parameter the Amplitude
// browser SDK reads on the destination (cross-domain tracking docs).
export function appDeepLink(base: string): string {
  const id = getDeviceId();
  if (!base || !id) return base;
  try {
    const u = new URL(base);
    u.searchParams.set("ampDeviceId", id);
    return u.toString();
  } catch {
    return base;
  }
}

/** Test hook: reset module state. */
export function resetAnalyticsForTests(): void {
  queue = [];
  sink = null;
  deviceId = null;
  enabled = true;
  leadSender = null;
  headlineVariant = "unknown";
}

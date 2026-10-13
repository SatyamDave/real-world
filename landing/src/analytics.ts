// One track() wrapper for the whole page. Every event carries headline_variant
// and goes to Amplitude, and a saved signup also goes to the Reddit and X pixels.
// The SDKs load after first paint (initAnalytics), so events fired earlier wait
// in a queue and are replayed in order (see initAfterPaint for when they start). Until the visitor accepts the cookie
// notice nothing is queued, loaded or sent; with a Global Privacy Control or
// Do Not Track signal nothing loads and nothing is sent. Event list and
// properties: landing/analytics/TRACKING_PLAN.md.
import { config } from "./config";

let headlineVariant = "unknown";
// Set from the build, so events queued before the SDK starts carry it too.
let environment = config.environment;

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
  // Optional so a missing value reads as production, never as a test environment.
  environment?: string;
  amplitudeDevSend?: boolean;
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
let consented = false;
let leadSender: ((eventId: string) => void) | null = null;

/** True when the visitor signals they do not want to be tracked. */
export function privacySignal(nav: Navigator & { globalPrivacyControl?: boolean }): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

/** Set from the cookie notice. Declining drops anything queued. */
export function setConsented(value: boolean): void {
  consented = value;
  if (!value) queue = [];
}

export function track(name: EventName, props: Record<string, unknown> = {}): void {
  if (!enabled || !consented) return;
  const payload = { headline_variant: headlineVariant, environment, ...props };
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
  if (!consented) return;
  if (privacySignal(nav)) {
    enabled = false;
    queue = [];
    return;
  }
  environment = cfg.environment ?? environment;
  // Local dev logs events to the console (see track) and does not load Amplitude, unless
  // asked to, with the staging key. Events are tagged "development" either way.
  const useAmplitude =
    Boolean(cfg.amplitudeKey) && (environment !== "development" || cfg.amplitudeDevSend);
  const wantsPixels = Boolean(cfg.redditPixelId || cfg.xPixelId);
  const jobs: Promise<void>[] = [];

  if (useAmplitude) {
    jobs.push(
      loaders
        .amplitude()
        .then((m) =>
          m.start({
            apiKey: cfg.amplitudeKey,
            replaySampleRate: cfg.replaySampleRate,
            headlineVariant,
            environment,
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

const INTERACTION_EVENTS = ["pointerdown", "keydown", "focusin", "touchstart"] as const;

/**
 * Start the SDKs after the page has loaded, on the first interaction or after `delayMs`,
 * whichever comes first. Keeping the SDKs out of the first paint keeps them from
 * competing with it on slow phones; events fired before the start wait in the queue.
 * A visitor who leaves within `delayMs` without touching anything is not counted.
 */
export function initAfterPaint(
  delayMs = 1500,
  start: () => void = () => void initAnalytics(),
): void {
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    for (const e of INTERACTION_EVENTS) window.removeEventListener(e, go, true);
    start();
  };
  const arm = () => {
    for (const e of INTERACTION_EVENTS) {
      window.addEventListener(e, go, { capture: true, passive: true });
    }
    window.setTimeout(go, delayMs);
  };
  if (document.readyState === "complete") arm();
  else window.addEventListener("load", arm, { once: true });
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
  consented = false;
  leadSender = null;
  headlineVariant = "unknown";
  environment = "production";
}

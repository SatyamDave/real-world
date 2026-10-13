// Runtime config read from Vite build-time env (VITE_*). Server-only secrets
// (DATABASE_URL, TURNSTILE_SECRET_KEY, ...) live in .dev.vars and never reach
// the client bundle.
const env = import.meta.env;

export const config = {
  // The v1 app base URL. While empty, every "Try it" link is hidden (brief).
  appUrl: (env.VITE_APP_URL ?? "").trim(),
  // Base URL of this deployment, for canonical/OG. A *.pages.dev preview tonight.
  baseUrl: (env.VITE_PUBLIC_BASE_URL ?? "").trim(),
  // Turnstile public site key for the bot-check widget.
  turnstileSiteKey: (env.VITE_TURNSTILE_SITE_KEY ?? "").trim(),
  // Tally form id (the part after tally.so/r/), one form per environment: landing/tally/FORM_SPEC.md.
  tallyFormId: (env.VITE_TALLY_FORM_ID ?? "").trim(),
  // "development" | "staging" | "production". Set per build with VITE_ENVIRONMENT; with
  // nothing set, `vite dev` is development and any build is production.
  environment: (env.VITE_ENVIRONMENT ?? (env.DEV ? "development" : "production")).trim(),
  // Development only: send to Amplitude (the staging key) instead of logging to the console.
  amplitudeDevSend: (env.VITE_AMPLITUDE_DEV_SEND ?? "false").trim() === "true",
  // Amplitude browser key (public) and the session-replay sample rate, 0..1.
  amplitudeKey: (env.VITE_AMPLITUDE_API_KEY ?? "").trim(),
  replaySampleRate: Math.min(
    1,
    Math.max(0, Number(env.VITE_AMPLITUDE_REPLAY_SAMPLE_RATE ?? "0.1") || 0),
  ),
  // Ad pixels: each loads only when its id is set.
  redditPixelId: (env.VITE_REDDIT_PIXEL_ID ?? "").trim(),
  xPixelId: (env.VITE_X_PIXEL_ID ?? "").trim(),
  // The X event id for a Lead, created in X Ads Manager (looks like tw-<pixel>-<event>).
  xLeadEventId: (env.VITE_X_LEAD_EVENT_ID ?? "").trim(),
  metaPixelId: (env.VITE_META_PIXEL_ID ?? "").trim(),
  enableMetaPixel: (env.VITE_ENABLE_META_PIXEL ?? "false").trim() === "true",
} as const;

export const hasAppUrl = config.appUrl.length > 0;

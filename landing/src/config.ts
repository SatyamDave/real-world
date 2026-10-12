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
  // Ad pixels: each loads only when its id is set (PR4).
  redditPixelId: (env.VITE_REDDIT_PIXEL_ID ?? "").trim(),
  xPixelId: (env.VITE_X_PIXEL_ID ?? "").trim(),
  metaPixelId: (env.VITE_META_PIXEL_ID ?? "").trim(),
  enableMetaPixel: (env.VITE_ENABLE_META_PIXEL ?? "false").trim() === "true",
} as const;

export const hasAppUrl = config.appUrl.length > 0;

import { useCallback, useEffect, useRef } from "react";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
  remove(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile failed to load"));
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Renders the Cloudflare Turnstile widget into `ref` and exposes its token.
 * With no site key it does nothing, and token() is null.
 */
export function useTurnstile(siteKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (t: string) => {
            tokenRef.current = t;
          },
          "expired-callback": () => {
            tokenRef.current = null;
          },
          "error-callback": () => {
            tokenRef.current = null;
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey]);

  const token = useCallback(() => tokenRef.current, []);
  // A Turnstile token is single-use; request a fresh one after each attempt.
  const reset = useCallback(() => {
    tokenRef.current = null;
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, []);
  return { ref, token, reset };
}

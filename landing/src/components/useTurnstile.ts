import { useCallback, useEffect, useRef, useState } from "react";

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
 * Renders the Cloudflare Turnstile widget into `ref` and exposes its token. The script
 * and widget load only once the visitor touches the form (arm) or submits (waitForToken),
 * so the bot check costs nothing before first paint. With no site key it does nothing.
 */
export function useTurnstile(siteKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const waiters = useRef<((token: string | null) => void)[]>([]);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!siteKey || !armed) return;
    let cancelled = false;
    const give = (t: string | null) => {
      tokenRef.current = t;
      if (t) for (const w of waiters.current.splice(0)) w(t);
    };
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: (t: string) => give(t),
          "expired-callback": () => give(null),
          "error-callback": () => give(null),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, armed]);

  /** Start loading the widget (call on focus or touch of the form). */
  const arm = useCallback(() => setArmed(true), []);
  const token = useCallback(() => tokenRef.current, []);
  /** Resolve with a token, loading the widget if needed and waiting up to `ms`; null on timeout. */
  const waitForToken = useCallback(
    (ms = 6000): Promise<string | null> => {
      if (!siteKey) return Promise.resolve(null);
      if (tokenRef.current) return Promise.resolve(tokenRef.current);
      setArmed(true);
      return new Promise((resolve) => {
        const done = (t: string | null) => {
          clearTimeout(timer);
          resolve(t);
        };
        const timer = setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== done);
          resolve(null);
        }, ms);
        waiters.current.push(done);
      });
    },
    [siteKey],
  );
  // A Turnstile token is single-use; request a fresh one after each attempt.
  const reset = useCallback(() => {
    tokenRef.current = null;
    if (!widgetId.current) return;
    // After a successful signup the form's markup is replaced while this hook stays
    // mounted; resetting a widget whose container left the page only logs a warning.
    if (ref.current?.isConnected) window.turnstile?.reset(widgetId.current);
    else widgetId.current = undefined;
  }, []);
  // Remove the widget while its container is still in the page. Turnstile finds a
  // widget by the id of its iframe, so a widget whose container React has already
  // removed can only log "Cannot find Widget" when its own timers fire.
  const dispose = useCallback(() => {
    tokenRef.current = null;
    if (!widgetId.current) return;
    if (ref.current?.isConnected) window.turnstile?.remove(widgetId.current);
    widgetId.current = undefined;
  }, []);
  return { ref, token, arm, waitForToken, reset, dispose };
}

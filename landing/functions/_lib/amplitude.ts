// Server-side events via the Amplitude HTTP API v2. insert_id makes a retried
// or replayed call idempotent. Never throws: analytics must not fail a signup.
const URL_V2 = "https://api2.amplitude.com/2/httpapi";

export interface ServerEvent {
  event_type: "waitlist_email_saved" | "waitlist_completed";
  insert_id: string;
  signup_id: string;
  device_id?: string | null;
  headline_variant?: string | null;
  props?: Record<string, unknown>;
}

export async function sendEvent(
  apiKey: string | undefined,
  e: ServerEvent,
  doFetch: typeof fetch,
  now: Date,
): Promise<void> {
  if (!apiKey) return;
  try {
    await doFetch(URL_V2, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        events: [
          {
            event_type: e.event_type,
            insert_id: e.insert_id,
            // Amplitude needs a user_id or device_id; the signup id is the stable join key.
            user_id: e.device_id ? undefined : e.signup_id,
            device_id: e.device_id ?? undefined,
            time: now.getTime(),
            event_properties: {
              signup_id: e.signup_id,
              headline_variant: e.headline_variant ?? "unknown",
              ...e.props,
            },
          },
        ],
      }),
    });
  } catch {
    // swallow
  }
}

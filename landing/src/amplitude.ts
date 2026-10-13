// Loaded on demand by analytics.ts after first paint, so the SDK stays out of
// the critical bundle. Browser SDK 2 with autocapture of page views, sessions
// and UTM and referrer attribution only (element and form autocapture would
// send on-page text), and optional session replay with all text masked. See landing/analytics/TRACKING_PLAN.md.
import * as amp from "@amplitude/analytics-browser";

export interface StartOptions {
  apiKey: string;
  replaySampleRate: number;
  headlineVariant: string;
  environment: string;
}

export interface Started {
  deviceId: string | undefined;
  track: (name: string, props: Record<string, unknown>) => void;
}

export async function start(opts: StartOptions): Promise<Started> {
  // Passing undefined keeps the SDK's own handling of the ampDeviceId URL
  // parameter, which carries the id across domains (Amplitude cross-domain docs).
  await amp.init(opts.apiKey, undefined, {
    // Do not send the visitor's IP address, so Amplitude does not geolocate it (the
    // country we need is already saved with the signup from the request header).
    trackingOptions: { ipAddress: false },
    autocapture: {
      pageViews: true,
      sessions: true,
      elementInteractions: false,
      formInteractions: false,
      attribution: true,
      fileDownloads: false,
      frustrationInteractions: false,
      networkTracking: false,
      webVitals: false,
    },
  }).promise;

  const identify = new amp.Identify();
  identify.set("headline_variant", opts.headlineVariant);
  identify.set("environment", opts.environment);
  amp.identify(identify);

  if (opts.replaySampleRate > 0) {
    // Session replay is the heavy part, so it is a second dynamic import.
    const { sessionReplayPlugin } = await import("@amplitude/plugin-session-replay-browser");
    await amp.add(
      sessionReplayPlugin({
        sampleRate: opts.replaySampleRate,
        privacyConfig: { defaultMaskLevel: "conservative" },
      }),
    ).promise;
  }

  return {
    deviceId: amp.getDeviceId(),
    track: (name, props) => {
      amp.track(name, props);
    },
  };
}

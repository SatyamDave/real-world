// Loaded on demand by analytics.ts after first paint, so the SDK stays out of
// the critical bundle. Browser SDK 2 with autocapture (page views, sessions,
// element and form interactions, UTM and referrer attribution) and optional
// session replay at a sample rate. See landing/analytics/TRACKING_PLAN.md.
import * as amp from "@amplitude/analytics-browser";

export interface StartOptions {
  apiKey: string;
  replaySampleRate: number;
  headlineVariant: string;
}

export interface Started {
  deviceId: string | undefined;
  track: (name: string, props: Record<string, unknown>) => void;
}

export async function start(opts: StartOptions): Promise<Started> {
  // Passing undefined keeps the SDK's own handling of the ampDeviceId URL
  // parameter, which carries the id across domains (Amplitude cross-domain docs).
  await amp.init(opts.apiKey, undefined, {
    autocapture: {
      pageViews: true,
      sessions: true,
      elementInteractions: true,
      formInteractions: true,
      attribution: true,
      fileDownloads: false,
      frustrationInteractions: false,
      networkTracking: false,
      webVitals: false,
    },
  }).promise;

  const identify = new amp.Identify();
  identify.set("headline_variant", opts.headlineVariant);
  amp.identify(identify);

  if (opts.replaySampleRate > 0) {
    // Session replay is the heavy part, so it is a second dynamic import.
    // Text inputs (the email field) are masked by default and by the amp-mask class.
    const { sessionReplayPlugin } = await import("@amplitude/plugin-session-replay-browser");
    await amp.add(
      sessionReplayPlugin({
        sampleRate: opts.replaySampleRate,
        privacyConfig: { defaultMaskLevel: "medium" },
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

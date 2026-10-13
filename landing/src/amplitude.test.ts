import { beforeEach, expect, test, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  init: vi.fn(() => ({ promise: Promise.resolve() })),
  add: vi.fn(() => ({ promise: Promise.resolve() })),
  identify: vi.fn(),
  track: vi.fn(),
  getDeviceId: vi.fn(() => "dev-1"),
  Identify: class {
    set = vi.fn();
  },
}));
vi.mock("@amplitude/analytics-browser", () => sdk);
const replay = vi.hoisted(() => ({ sessionReplayPlugin: vi.fn(() => ({ name: "replay" })) }));
vi.mock("@amplitude/plugin-session-replay-browser", () => replay);

import { start } from "./amplitude";

beforeEach(() => vi.clearAllMocks());

test("the SDK is started without IP collection and with the autocapture we documented", async () => {
  await start({
    apiKey: "k",
    replaySampleRate: 0,
    headlineVariant: "hashed",
    environment: "staging",
  });
  const [key, , options] = sdk.init.mock.calls[0] as unknown as [
    string,
    unknown,
    Record<string, unknown>,
  ];
  expect(key).toBe("k");
  expect(options.trackingOptions).toEqual({ ipAddress: false });
  expect(options.autocapture).toMatchObject({
    pageViews: true,
    sessions: true,
    elementInteractions: true,
    formInteractions: true,
    attribution: true,
    fileDownloads: false,
    networkTracking: false,
  });
});

test("session replay loads only when the sample rate is above zero, with inputs masked", async () => {
  await start({ apiKey: "k", replaySampleRate: 0, headlineVariant: "x", environment: "staging" });
  expect(replay.sessionReplayPlugin).not.toHaveBeenCalled();
  await start({
    apiKey: "k",
    replaySampleRate: 0.25,
    headlineVariant: "x",
    environment: "staging",
  });
  expect(replay.sessionReplayPlugin).toHaveBeenCalledWith({
    sampleRate: 0.25,
    privacyConfig: { defaultMaskLevel: "medium" },
  });
});

test("it returns the device id and a track function", async () => {
  const started = await start({
    apiKey: "k",
    replaySampleRate: 0,
    headlineVariant: "x",
    environment: "staging",
  });
  expect(started.deviceId).toBe("dev-1");
  started.track("cta_clicked", { a: 1 });
  expect(sdk.track).toHaveBeenCalledWith("cta_clicked", { a: 1 });
});

test("the environment is stored on the user as well", async () => {
  await start({ apiKey: "k", replaySampleRate: 0, headlineVariant: "x", environment: "staging" });
  expect(sdk.identify).toHaveBeenCalled();
});

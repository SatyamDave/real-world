// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  type AnalyticsConfig,
  appDeepLink,
  getDeviceId,
  initAfterPaint,
  initAnalytics,
  type Loaders,
  privacySignal,
  resetAnalyticsForTests,
  setHeadlineVariant,
  track,
} from "./analytics";

const base: AnalyticsConfig = {
  amplitudeKey: "key",
  replaySampleRate: 0.1,
  redditPixelId: "",
  xPixelId: "",
  xLeadEventId: "",
};
const nav = (over: Record<string, unknown> = {}) => ({ doNotTrack: null, ...over }) as Navigator;

function fakeLoaders() {
  const sent: { name: string; props: Record<string, unknown> }[] = [];
  const start = vi.fn(async () => ({
    deviceId: "dev-123",
    track: (name: string, props: Record<string, unknown>) => sent.push({ name, props }),
  }));
  const pixels = { loadReddit: vi.fn(), loadX: vi.fn(), sendLead: vi.fn() };
  const loaders = {
    amplitude: vi.fn(async () => ({ start })),
    pixels: vi.fn(async () => pixels),
  } as unknown as Loaders;
  return { sent, start, pixels, loaders };
}

beforeEach(() => resetAnalyticsForTests());

test("events fired before the SDK loads are replayed in order, each with headline_variant", async () => {
  const { sent, loaders, start } = fakeLoaders();
  setHeadlineVariant("hashed");
  track("landing_viewed", { path: "/" });
  track("cta_clicked", { location: "hero" });
  await initAnalytics(base, loaders, nav());
  track("email_submitted", { location: "hero" });
  expect(sent.map((e) => e.name)).toEqual(["landing_viewed", "cta_clicked", "email_submitted"]);
  expect(sent.every((e) => e.props.headline_variant === "hashed")).toBe(true);
  expect(start).toHaveBeenCalledWith(
    expect.objectContaining({ apiKey: "key", replaySampleRate: 0.1, headlineVariant: "hashed" }),
  );
  expect(getDeviceId()).toBe("dev-123");
});

test("no Amplitude key: the SDK is never loaded and nothing throws", async () => {
  const { loaders } = fakeLoaders();
  track("landing_viewed");
  await initAnalytics({ ...base, amplitudeKey: "" }, loaders, nav());
  track("cta_clicked");
  expect(loaders.amplitude).not.toHaveBeenCalled();
  expect(getDeviceId()).toBeNull();
});

test("Global Privacy Control or Do Not Track: nothing loads and nothing is sent", async () => {
  expect(privacySignal(nav({ globalPrivacyControl: true }) as never)).toBe(true);
  expect(privacySignal(nav({ doNotTrack: "1" }) as never)).toBe(true);
  expect(privacySignal(nav() as never)).toBe(false);
  const { sent, loaders } = fakeLoaders();
  track("landing_viewed");
  await initAnalytics(
    { ...base, redditPixelId: "r", xPixelId: "x" },
    loaders,
    nav({ globalPrivacyControl: true }),
  );
  track("signup_saved", { signup_id: "s1" });
  expect(loaders.amplitude).not.toHaveBeenCalled();
  expect(loaders.pixels).not.toHaveBeenCalled();
  expect(sent).toHaveLength(0);
});

test("pixels load only for configured ids, and Lead fires on a new signup only, keyed by signup id", async () => {
  const { loaders, pixels } = fakeLoaders();
  await initAnalytics(
    { ...base, redditPixelId: "r1", xPixelId: "", xLeadEventId: "tw-1-2" },
    loaders,
    nav(),
  );
  expect(pixels.loadReddit).toHaveBeenCalledWith("r1");
  expect(pixels.loadX).not.toHaveBeenCalled();
  track("cta_clicked");
  track("signup_duplicate", { signup_id: "s0" });
  expect(pixels.sendLead).not.toHaveBeenCalled();
  track("signup_saved", { signup_id: "s1" });
  expect(pixels.sendLead).toHaveBeenCalledTimes(1);
  expect(pixels.sendLead).toHaveBeenCalledWith("s1", "tw-1-2");
});

test("no pixel ids: the pixel module is never loaded", async () => {
  const { loaders } = fakeLoaders();
  await initAnalytics(base, loaders, nav());
  expect(loaders.pixels).not.toHaveBeenCalled();
});

test("an SDK that fails to load is swallowed and later events do not throw", async () => {
  const loaders = {
    amplitude: vi.fn(async () => {
      throw new Error("blocked");
    }),
    pixels: vi.fn(),
  } as unknown as Loaders;
  track("landing_viewed");
  await expect(initAnalytics(base, loaders, nav())).resolves.toBeUndefined();
  expect(() => track("cta_clicked")).not.toThrow();
});

test("the app link carries ampDeviceId once the SDK has started", async () => {
  const { loaders } = fakeLoaders();
  expect(appDeepLink("https://app.example.com/")).toBe("https://app.example.com/");
  await initAnalytics(base, loaders, nav());
  expect(appDeepLink("https://app.example.com/")).toBe(
    "https://app.example.com/?ampDeviceId=dev-123",
  );
  expect(appDeepLink("")).toBe("");
});

test("initAfterPaint starts once: on the first interaction or after the delay, whichever is first", () => {
  vi.useFakeTimers();
  try {
    const start = vi.fn();
    initAfterPaint(1500, start);
    vi.advanceTimersByTime(1000);
    expect(start).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("pointerdown"));
    expect(start).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    window.dispatchEvent(new Event("keydown"));
    expect(start).toHaveBeenCalledTimes(1);

    const second = vi.fn();
    initAfterPaint(1500, second);
    vi.advanceTimersByTime(1499);
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(second).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

describe("environment", () => {
  const loaders = () => {
    const start = vi.fn(async () => ({ deviceId: "d", track: vi.fn() }));
    return {
      start,
      loaders: { amplitude: async () => ({ start }) as never, pixels: async () => ({}) as never },
    };
  };
  const base = {
    amplitudeKey: "k",
    replaySampleRate: 0,
    redditPixelId: "",
    xPixelId: "",
    xLeadEventId: "",
  };
  const nav = { doNotTrack: "0" } as Navigator;

  test("development does not load Amplitude by default", async () => {
    const l = loaders();
    await initAnalytics({ ...base, environment: "development" }, l.loaders, nav);
    expect(l.start).not.toHaveBeenCalled();
  });

  test("development loads it with the staging key only when asked", async () => {
    const l = loaders();
    await initAnalytics(
      { ...base, environment: "development", amplitudeDevSend: true },
      l.loaders,
      nav,
    );
    expect(l.start).toHaveBeenCalledWith(expect.objectContaining({ environment: "development" }));
  });

  test("staging passes its environment to the SDK and tags queued events", async () => {
    const l = loaders();
    await initAnalytics({ ...base, environment: "staging" }, l.loaders, nav);
    expect(l.start).toHaveBeenCalledWith(expect.objectContaining({ environment: "staging" }));
  });
});

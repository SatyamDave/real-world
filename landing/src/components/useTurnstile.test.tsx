// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, expect, test, vi } from "vitest";
import { useTurnstile } from "./useTurnstile";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const api = { render: vi.fn(() => "widget-1"), reset: vi.fn(), remove: vi.fn() };
let handle: ReturnType<typeof useTurnstile>;
let setShown: (v: boolean) => void;

function Probe() {
  const [shown, set] = useState(true);
  setShown = set;
  handle = useTurnstile("site-key");
  return shown ? <div ref={handle.ref} /> : null;
}

beforeEach(() => {
  vi.clearAllMocks();
  (window as unknown as { turnstile: typeof api }).turnstile = api;
});

test("reset skips a widget whose container has left the page (the success state replaces the form)", async () => {
  const container = document.body.appendChild(document.createElement("div"));
  await act(async () => createRoot(container).render(<Probe />));
  expect(api.render).not.toHaveBeenCalled(); // nothing loads before the visitor touches the form
  await act(async () => handle.arm());
  await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(1));

  handle.reset(); // container still mounted: a normal reset
  expect(api.reset).toHaveBeenCalledTimes(1);

  await act(async () => setShown(false)); // the widget's div is removed, the component stays mounted
  handle.reset();
  expect(api.reset).toHaveBeenCalledTimes(1); // no second call on a removed widget
  expect(handle.token()).toBeNull();
});

test("dispose removes the widget while its container is in the page, and later calls do nothing", async () => {
  const container = document.body.appendChild(document.createElement("div"));
  await act(async () => createRoot(container).render(<Probe />));
  expect(api.render).not.toHaveBeenCalled(); // nothing loads before the visitor touches the form
  await act(async () => handle.arm());
  await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(1));

  handle.dispose();
  expect(api.remove).toHaveBeenCalledTimes(1);
  expect(api.remove).toHaveBeenCalledWith("widget-1");
  expect(handle.token()).toBeNull();

  handle.reset();
  handle.dispose();
  expect(api.reset).not.toHaveBeenCalled();
  expect(api.remove).toHaveBeenCalledTimes(1);
});

test("waitForToken arms the widget and resolves with the token Turnstile provides", async () => {
  const container = document.body.appendChild(document.createElement("div"));
  await act(async () => createRoot(container).render(<Probe />));
  const pending = handle.waitForToken(5000);
  await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(1));
  const opts = (
    api.render.mock.calls[0] as unknown as [unknown, { callback: (t: string) => void }]
  )[1];
  opts.callback("tok-123");
  await expect(pending).resolves.toBe("tok-123");
  await expect(handle.waitForToken()).resolves.toBe("tok-123"); // already have one
});

test("waitForToken gives up with null after the timeout", async () => {
  vi.useFakeTimers();
  try {
    const container = document.body.appendChild(document.createElement("div"));
    await act(async () => createRoot(container).render(<Probe />));
    const pending = handle.waitForToken(1000);
    await vi.advanceTimersByTimeAsync(1001);
    await expect(pending).resolves.toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

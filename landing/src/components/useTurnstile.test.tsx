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
  await vi.waitFor(() => expect(api.render).toHaveBeenCalledTimes(1));

  handle.reset(); // container still mounted: a normal reset
  expect(api.reset).toHaveBeenCalledTimes(1);

  await act(async () => setShown(false)); // the widget's div is removed, the component stays mounted
  handle.reset();
  expect(api.reset).toHaveBeenCalledTimes(1); // no second call on a removed widget
  expect(handle.token()).toBeNull();
});

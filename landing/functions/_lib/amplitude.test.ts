import { expect, test, vi } from "vitest";
import { sendEvent } from "./amplitude";

const ev = {
  event_type: "waitlist_email_saved" as const,
  insert_id: "i1",
  signup_id: "s1",
  device_id: "d1",
};

function makeFetch() {
  return vi.fn(async (..._args: unknown[]) => new Response("{}"));
}
function sent(f: ReturnType<typeof makeFetch>) {
  return JSON.parse(String((f.mock.calls[0][1] as RequestInit).body));
}

test("staging and production events carry their environment", async () => {
  for (const environment of ["staging", "production"]) {
    const f = makeFetch();
    await sendEvent("k", ev, f as unknown as typeof fetch, new Date(0), environment);
    expect(sent(f).events[0].event_properties.environment).toBe(environment);
  }
});

test("without a device id, that is without cookie consent, nothing is sent", async () => {
  const f = makeFetch();
  await sendEvent("k", { ...ev, device_id: null }, f as unknown as typeof fetch, new Date(0));
  expect(f).not.toHaveBeenCalled();
});

test("an unset environment is tagged production, never test", async () => {
  const f = makeFetch();
  await sendEvent("k", ev, f as unknown as typeof fetch, new Date(0));
  expect(sent(f).events[0].event_properties.environment).toBe("production");
});

test("development logs to the console and sends nothing, even with a key", async () => {
  const f = makeFetch();
  const log = vi.spyOn(console, "debug").mockImplementation(() => {});
  await sendEvent("k", ev, f as unknown as typeof fetch, new Date(0), "development");
  expect(f).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalled();
  log.mockRestore();
});

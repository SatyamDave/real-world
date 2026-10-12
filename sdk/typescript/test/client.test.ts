import { describe, expect, it } from "vitest";
import spec from "../../../api/openapi.json";
import { API_VERSION, Client } from "../src/index";

const EVENT = { event: { text: "A chip shortage doubles phone prices worldwide." } };
const CREATED = { id: "job_1", status: "queued", links: { self: "/s", events: "/e" } };

/** A client over a fake fetch that records each request and answers from responses. */
function recording(responses: (() => Response)[]) {
  const seen: Request[] = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push(new Request(input, init));
    return responses[seen.length - 1]();
  };
  return { client: new Client("http://test", fetcher), seen };
}

const json = (status: number, body: unknown) => () =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function stream(chunks: string[], drop = false) {
  return () =>
    new Response(
      new ReadableStream({
        pull(controller) {
          const c = chunks.shift();
          if (c !== undefined) controller.enqueue(new TextEncoder().encode(c));
          else if (drop) controller.error(new TypeError("connection dropped"));
          else controller.close();
        },
      }),
      { headers: { "Content-Type": "text/event-stream" } },
    );
}

describe("simulate", () => {
  it("generates an idempotency key and sends the version", async () => {
    const { client, seen } = recording([json(202, CREATED), json(202, CREATED)]);
    expect((await client.simulate(EVENT)).id).toBe("job_1");
    await client.simulate(EVENT);
    const [first, second] = seen;
    expect(first.headers.get("Real-World-Version")).toBe(API_VERSION);
    expect(first.headers.get("Idempotency-Key")).toBeTruthy();
    expect(first.headers.get("Idempotency-Key")).not.toBe(second.headers.get("Idempotency-Key"));
    expect(await first.json()).toEqual(EVENT);
  });

  it("sends the given idempotency key", async () => {
    const { client, seen } = recording([json(202, CREATED)]);
    await client.simulate(EVENT, "k-1");
    expect(seen[0].headers.get("Idempotency-Key")).toBe("k-1");
  });

  it("pins the version in the OpenAPI file", () => {
    expect(API_VERSION).toBe(spec.info.version);
  });

  it("rejects an error status with the body", async () => {
    const { client } = recording([json(402, { detail: "over cap" })]);
    await expect(client.simulate(EVENT)).rejects.toThrow(/402.*over cap/);
  });
});

describe("events", () => {
  it("parses SSE, skips heartbeats and resumes from the last id", async () => {
    const { client, seen } = recording([
      stream(['id: 1\ndata: {"type": "progress", "day": 1}\n\n: heart', "beat\n\n"], true),
      stream([
        'id: 2\ndata: {"type": "progress", "day": 2}\n\nid: 3\ndata: {"type": ',
        '"succeeded"}\n\n',
      ]),
    ]);
    const events = [];
    for await (const e of client.events("job_1")) events.push(e);
    expect(events.map((e) => e.day)).toEqual([1, 2, undefined]);
    expect(events.at(-1)?.type).toBe("succeeded");
    expect(seen[0].headers.get("Last-Event-ID")).toBeNull();
    expect(seen[1].headers.get("Last-Event-ID")).toBe("1");
  });

  it("gives up after a second drop in a row", async () => {
    const { client } = recording([stream([], true), stream([], true)]);
    const drain = async () => {
      for await (const _ of client.events("job_1"));
    };
    await expect(drain()).rejects.toThrow("connection dropped");
  });
});

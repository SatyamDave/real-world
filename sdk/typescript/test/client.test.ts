import { describe, expect, it } from "vitest";
import spec from "../../../api/openapi.json";
import { API_VERSION, ApiError, Client } from "../src/index";

const EVENT = { event: { text: "A chip shortage doubles phone prices worldwide." } };
const CREATED = { id: "job_1", status: "queued", links: { self: "/s", events: "/e" } };

/** A client over a fake fetch that records each request and answers from responses. */
function recording(responses: (() => Response)[]) {
  const seen: Request[] = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push(new Request(input, init));
    return responses[seen.length - 1]();
  };
  return { client: new Client("http://test", { fetch: fetcher }), seen };
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

  it("sends an api key as a bearer token, and none without one", async () => {
    const seen: Request[] = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Request(input, init));
      return json(202, CREATED)();
    };
    await new Client("http://test", { fetch: fetcher, apiKey: "rw_abc" }).simulate(EVENT);
    await new Client("http://test", { fetch: fetcher }).simulate(EVENT);
    expect(seen[0].headers.get("Authorization")).toBe("Bearer rw_abc");
    expect(seen[1].headers.get("Authorization")).toBeNull();
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
    const err = await client.simulate(EVENT).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(402);
    expect(err.body).toEqual({ detail: "over cap" });
    expect(err.detail).toBe("over cap");
    expect(err.code).toBeUndefined();
    expect(err.message).toBe('402: {"detail":"over cap"}');
  });

  it("keeps a body that is not JSON as text", async () => {
    const { client } = recording([() => new Response("bad gateway", { status: 502 })]);
    const err = await client.world().catch((e) => e);
    expect(err.body).toBe("bad gateway");
    expect(err.message).toBe("502: bad gateway");
  });

  it("retries a connection error once and no more", async () => {
    const drop = () => {
      throw new TypeError("refused");
    };
    const ok = json(200, {});
    const first = recording([drop, ok]);
    await first.client.scores();
    expect(first.seen).toHaveLength(2);
    const second = recording([drop, drop, drop]);
    await expect(second.client.scores()).rejects.toThrow("refused");
    expect(second.seen).toHaveLength(2);
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

describe("events errors", () => {
  it("sends the key and version and rejects with the parsed body", async () => {
    const seen: Request[] = [];
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Request(input, init));
      return json(404, { detail: "no fork job_1" })();
    };
    const client = new Client("http://test", { fetch: fetcher, apiKey: "rw_abc" });
    const err = await client
      .events("job_1")
      .next()
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.body).toEqual({ detail: "no fork job_1" });
    expect(seen[0].headers.get("Authorization")).toBe("Bearer rw_abc");
    expect(seen[0].headers.get("Real-World-Version")).toBe(API_VERSION);
  });
});

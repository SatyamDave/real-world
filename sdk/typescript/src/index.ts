// Client for the Real World Simulate API. Contract: product/sdks.md and api/openapi.json.
import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema";

type Schemas = components["schemas"];
export type SimulateRequest = Schemas["SimulateRequest"];
export type SimulateResult = Schemas["SimulateResult"];
export type JobCreated = Schemas["JobCreated"];
export type Job = Schemas["Job"];
export type Estimate = Schemas["Estimate"];
export type World = Schemas["World"];
export type Agent = Schemas["Agent"];
export type AgentWhy = Schemas["AgentWhy"];
export type Daily = Schemas["Daily"];
export type Receipts = Schemas["Receipts"];
export type ReceiptDay = Schemas["ReceiptDay"];
export type BaselineSkill = Schemas["BaselineSkill"];
export type Country = Schemas["Country"];
export type PrefilledEvent = Schemas["PrefilledEvent"];
export type Reveal = Schemas["Reveal"];
export type DayRecord = Schemas["DayRecord"];
export type ReceiptEntry = Schemas["ReceiptEntry"];
export type Skill = Schemas["Skill"];
export type JobEvent = { type: string; [key: string]: unknown };
export type { components, paths };

export const API_VERSION = "2026-10-27";
const TERMINAL = ["succeeded", "failed"];

/** An error status from the API, with the parsed response body. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
}

async function ok<T>(call: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await call;
  if (error !== undefined || data === undefined) throw new ApiError(response.status, error);
  return data;
}

/** (id, data) for each complete event in buffer, and the unparsed rest; comments are skipped. */
export function parseSse(buffer: string): { events: [string | null, JobEvent][]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: [string | null, JobEvent][] = [];
  for (const block of blocks) {
    let id: string | null = null;
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("id:")) id = line.slice(3).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trim());
    }
    if (data.length) events.push([id, JSON.parse(data.join("\n"))]);
  }
  return { events, rest };
}

export class Client {
  private http;

  /** Without apiKey the API treats the caller as anonymous (product/simulate-api.md). */
  constructor(
    private baseUrl = "http://localhost:8000",
    private fetcher: typeof fetch = (...args) => fetch(...args),
    apiKey?: string,
  ) {
    const headers: Record<string, string> = { "Real-World-Version": API_VERSION };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    this.http = createClient<paths>({ baseUrl, fetch: fetcher, headers });
  }

  simulate(request: SimulateRequest, idempotency_key?: string): Promise<JobCreated> {
    const key = idempotency_key ?? crypto.randomUUID();
    const params = { header: { "Idempotency-Key": key } };
    return ok(this.http.POST("/v1/simulate", { params, body: request }));
  }

  estimate(request: SimulateRequest): Promise<Estimate> {
    return ok(this.http.POST("/v1/simulate/estimate", { body: request }));
  }

  get_simulation(id: string): Promise<Job> {
    return ok(this.http.GET("/v1/simulations/{job_id}", { params: { path: { job_id: id } } }));
  }

  /** Poll until the job finishes; reject if it failed or timeout seconds pass. */
  async wait(id: string, timeout = 120, interval = 0.5): Promise<SimulateResult> {
    const deadline = Date.now() + timeout * 1000;
    for (;;) {
      const job = await this.get_simulation(id);
      if (job.status === "failed") throw new Error(`simulation ${id} failed: ${job.error}`);
      if (job.result) return job.result;
      if (Date.now() > deadline) {
        throw new Error(`simulation ${id} still ${job.status} after ${timeout}s`);
      }
      await new Promise((r) => setTimeout(r, interval * 1000));
    }
  }

  /** Progress events until the job finishes, reconnecting once with Last-Event-ID if the
   * connection drops. */
  async *events(id: string, last_event_id?: string): AsyncGenerator<JobEvent> {
    let retried = false;
    for (;;) {
      const headers: Record<string, string> = { "Real-World-Version": API_VERSION };
      if (last_event_id) headers["Last-Event-ID"] = last_event_id;
      let response: Response;
      try {
        response = await this.fetcher(`${this.baseUrl}/v1/simulations/${id}/events`, { headers });
      } catch (e) {
        if (retried) throw e;
        retried = true;
        continue;
      }
      if (!response.ok || !response.body) {
        throw new ApiError(response.status, await response.text());
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) return;
          const parsed = parseSse(buffer + value.replaceAll("\r\n", "\n"));
          buffer = parsed.rest;
          for (const [eventId, data] of parsed.events) {
            last_event_id = eventId ?? last_event_id;
            retried = false;
            yield data;
            if (TERMINAL.includes(data.type)) return;
          }
        }
      } catch (e) {
        if (retried) throw e;
        retried = true;
      }
    }
  }

  world(): Promise<World> {
    return ok(this.http.GET("/v1/world"));
  }

  agent(id: string): Promise<Agent> {
    return ok(this.http.GET("/v1/agents/{agent_id}", { params: { path: { agent_id: id } } }));
  }

  agent_why(id: string): Promise<AgentWhy> {
    return ok(this.http.GET("/v1/agents/{agent_id}/why", { params: { path: { agent_id: id } } }));
  }

  daily(player_id?: string): Promise<Daily> {
    return ok(this.http.GET("/v1/daily", { params: { query: { player_id } } }));
  }

  answer_daily(question_id: string, player_id: string, probability: number): Promise<Daily> {
    const body = { question_id, player_id, probability };
    return ok(this.http.POST("/v1/daily/answers", { body }));
  }

  receipts(): Promise<Receipts> {
    return ok(this.http.GET("/v1/receipts"));
  }

  receipt_day(date: string): Promise<ReceiptDay> {
    return ok(this.http.GET("/v1/receipts/{day}", { params: { path: { day: date } } }));
  }

  scores(): Promise<Record<string, BaselineSkill>> {
    return ok(this.http.GET("/v1/scores"));
  }
}

// Client for the Real World API. Contract: product/sdks.md and api/openapi.json.
import createClient from "openapi-fetch";
import type { components, paths } from "./generated/schema";

type Schemas = components["schemas"];
export type SimulateRequest = Schemas["SimulateRequest"];
export type SimulateResult = Schemas["SimulateResult"];
export type JobCreated = Schemas["JobCreated"];
export type Job = Schemas["Job"];
export type Estimate = Schemas["Estimate"];
export type World = Schemas["World"];
export type Population = Schemas["Population"];
export type Agent = Schemas["Agent"];
export type AgentWhy = Schemas["AgentWhy"];
export type Daily = Schemas["Daily"];
export type SystemStatus = Schemas["SystemStatus"];
export type Scoreboard = Schemas["Scoreboard"];
export type Receipts = Schemas["Receipts"];
export type ReceiptDay = Schemas["ReceiptDay"];
export type LeafReceipt = Schemas["LeafReceipt"];
export type QuestionPage = Schemas["QuestionPage"];
export type BaselineSkill = Schemas["BaselineSkill"];
export type Country = Schemas["Country"];
export type PrefilledEvent = Schemas["PrefilledEvent"];
export type Reveal = Schemas["Reveal"];
export type DayRecord = Schemas["DayRecord"];
export type ReceiptEntry = Schemas["ReceiptEntry"];
export type Skill = Schemas["Skill"];
export type Person = Schemas["Person"];
export type PostTestRequest = Schemas["PostTestRequest"];
export type PostTestOut = Schemas["PostTestOut"];
export type PostTestResult = Schemas["PostTestResult"];
export type SegmentResult = Schemas["SegmentResult"];
export type BacktestRequest = Schemas["BacktestRequest"];
export type BacktestResult = Schemas["BacktestResult"];
export type Mark = Schemas["Mark"];
export type Metric = Schemas["Metric"];
export type TestRecord = Schemas["TestRecord"];
export type SealedTest = Schemas["SealedTest"];
export type VsAi = Schemas["VsAi"];
export type JobEvent = { type: string; [key: string]: unknown };
export type { components, paths };

export const API_VERSION = "2026-10-27";
const TERMINAL = ["succeeded", "failed"];

/** An error status from the API, with the parsed response body. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  // No parameter properties: Node strips types without compiling them, and rejects those.
  constructor(status: number, body: unknown) {
    super(`${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
  }

  get detail(): unknown {
    return isRecord(this.body) ? this.body.detail : undefined;
  }

  get code(): unknown {
    return isRecord(this.body) ? this.body.code : undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function errorOf(response: Response): Promise<ApiError> {
  const text = await response.text();
  try {
    return new ApiError(response.status, JSON.parse(text));
  } catch {
    return new ApiError(response.status, text);
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
  private baseUrl: string;
  private fetcher: typeof fetch;
  private headers: Record<string, string>;

  /** Without an API key the API treats the caller as anonymous. */
  constructor(
    baseUrl = "http://localhost:8000",
    options: { apiKey?: string; fetch?: typeof fetch } = {},
  ) {
    this.baseUrl = baseUrl;
    this.fetcher = options.fetch ?? ((...args) => fetch(...args));
    this.headers = { "Real-World-Version": API_VERSION };
    if (options.apiKey) this.headers.Authorization = `Bearer ${options.apiKey}`;
    const send = this.fetcher;
    const retrying: typeof fetch = async (input, init) => {
      const again = input instanceof Request ? input.clone() : input;
      try {
        return await send(input, init);
      } catch {
        return send(again, init);
      }
    };
    this.http = createClient<paths>({ baseUrl, fetch: retrying, headers: this.headers });
  }

  /** Starts a fork of today's world with one event and returns its job. */
  simulate(request: SimulateRequest, idempotency_key?: string): Promise<JobCreated> {
    const key = idempotency_key ?? crypto.randomUUID();
    const params = { header: { "Idempotency-Key": key } };
    return ok(this.http.POST("/v1/simulate", { params, body: request }));
  }

  /** Estimates the cost of a fork without running it. */
  estimate(request: SimulateRequest): Promise<Estimate> {
    return ok(this.http.POST("/v1/simulate/estimate", { body: request }));
  }

  /** Returns a fork's job, with its result once it has succeeded. */
  get_simulation(id: string): Promise<Job> {
    return ok(this.http.GET("/v1/simulations/{job_id}", { params: { path: { job_id: id } } }));
  }

  /** Polls until the fork finishes and returns its result, or fails if the fork failed or timeout seconds pass. */
  async wait(id: string, timeout = 120, interval = 0.5): Promise<SimulateResult> {
    const deadline = Date.now() + timeout * 1000;
    for (;;) {
      const job = await this.get_simulation(id);
      if (job.status === "failed") throw new Error(`fork ${id} failed: ${job.error}`);
      if (job.result) return job.result;
      if (Date.now() > deadline) {
        throw new Error(`fork ${id} still ${job.status} after ${timeout}s`);
      }
      await new Promise((r) => setTimeout(r, interval * 1000));
    }
  }

  /** Yields the fork's progress events until it finishes, reconnecting once with Last-Event-ID if the connection drops. */
  async *events(id: string, last_event_id?: string): AsyncGenerator<JobEvent> {
    let retried = false;
    for (;;) {
      const headers = { ...this.headers };
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
        throw await errorOf(response);
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

  /** Returns today's world: countries, coverage tiers, topic shares and prefilled fork events. */
  world(): Promise<World> {
    return ok(this.http.GET("/v1/world"));
  }

  /** Returns the simulated population: every country, segment and topic with its calibration and spread. */
  population(): Promise<Population> {
    return ok(this.http.GET("/v1/world/population"));
  }

  /** Returns one simulated agent: its traits, beliefs and what moved them. */
  agent(id: string): Promise<Agent> {
    return ok(this.http.GET("/v1/agents/{agent_id}", { params: { path: { agent_id: id } } }));
  }

  /** Returns a short model-written account of what moved one agent, labelled simulated. */
  agent_why(id: string): Promise<AgentWhy> {
    return ok(this.http.GET("/v1/agents/{agent_id}/why", { params: { path: { agent_id: id } } }));
  }

  /** Returns today's question, with the reveal once this player has answered. */
  daily(player_id?: string): Promise<Daily> {
    return ok(this.http.GET("/v1/daily", { params: { query: { player_id } } }));
  }

  /** Answers today's question once and returns the reveal. */
  answer_daily(question_id: string, player_id: string, probability: number): Promise<Daily> {
    const body = { question_id, player_id, probability };
    return ok(this.http.POST("/v1/daily/answers", { body }));
  }

  /** Lists every day record with its root and record hash. */
  receipts(): Promise<Receipts> {
    return ok(this.http.GET("/v1/receipts"));
  }

  /** Returns one day record with each receipt's entry, salt and leaf hash. */
  receipt_day(date: string): Promise<ReceiptDay> {
    return ok(this.http.GET("/v1/receipts/{day}", { params: { path: { day: date } } }));
  }

  /** Returns the live system status: latest cycle, ledger head, anchor, model, spend. */
  status(): Promise<SystemStatus> {
    return ok(this.http.GET("/v1/status"));
  }

  /** Returns one receipt with its inclusion proof up to the day record's root. */
  receipt_leaf(date: string, leaf_hash: string): Promise<LeafReceipt> {
    const path = { day: date, leaf_hash };
    return ok(this.http.GET("/v1/receipts/{day}/leaves/{leaf_hash}", { params: { path } }));
  }

  /** Returns one question with every committed forecast by day and forecaster. */
  question(id: string): Promise<QuestionPage> {
    return ok(
      this.http.GET("/v1/questions/{question_id}", { params: { path: { question_id: id } } }),
    );
  }

  /** Returns the skill of the simulation against each baseline. */
  scores(): Promise<Record<string, BaselineSkill>> {
    return ok(this.http.GET("/v1/scores"));
  }

  /** Returns the scoreboard: Brier per forecaster, skill, reliability bins and misses. */
  scoreboard(): Promise<Scoreboard> {
    return ok(this.http.GET("/v1/scoreboard"));
  }
}

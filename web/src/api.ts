// The only module that talks to the API. Shapes follow product/simulate-api.md, daily-question.md
// and receipts.md; the integration step replaces the bodies with @real-world/sdk calls.

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Tier = "A" | "B" | "C" | "D";

export interface Country {
  iso3: string;
  name: string;
  lat: number;
  lng: number;
  tier: Tier;
  experimental: boolean;
  agent_count: number;
  shares: Record<string, number>;
  sample_agent_id: string;
}

export interface PrefilledEvent {
  id: string;
  text: string;
}

export interface World {
  date: string;
  countries: Country[];
  daily_question_id: string;
  prefilled_events: PrefilledEvent[];
}

export interface AgentStep {
  date: string;
  topic: string;
  delta: number;
  cause: string;
}

export interface Agent {
  agent_id: string;
  iso3: string;
  tier: Tier;
  traits: Record<string, string>;
  shares: Record<string, number>;
  moved: AgentStep[];
}

export interface AgentWhy {
  agent_id: string;
  text: string;
  label: string;
  simulated: true;
}

export interface DailyQuestion {
  id: string;
  text: string;
  resolution_source: string;
  closes_at: string;
  resolves_by: string;
}

export interface Reveal {
  you: number;
  crowd: { mean: number; count: number };
  sim: number;
  market: number | null;
  outcome: 0 | 1 | null;
  brier: number | null;
  streak: number;
}

export interface Daily {
  question: DailyQuestion;
  reveal: Reveal | null;
}

export interface DayRecord {
  date: string;
  prev_root: string;
  root: string;
  leaf_count: string;
  protocol_hash: string;
  engine_version: string;
}

export interface ReceiptDaySummary extends DayRecord {
  record_hash: string;
  anchored: boolean;
}

export type Entry = Record<string, string>;

export interface Receipt {
  entry: Entry;
  salt: string;
  leaf_hash: string;
  outcome?: 0 | 1 | null;
  brier?: number | null;
}

export interface ReceiptDay {
  day: DayRecord;
  record_hash: string;
  anchored?: boolean;
  entries: Receipt[];
}

export interface Skill {
  n: number;
  n_pairs: number;
  mean_diff: number | null;
  low: number | null;
  high: number | null;
  claim: "reportable" | "insufficient_n";
}

export type Scores = Record<"market" | "plain_llm", Skill>;

export interface SimulateRequest {
  world?: string;
  event: { text: string; countries?: string[] };
  days?: number;
  members?: number;
  agents?: number;
  max_cost_usd?: number;
}

export interface Estimate {
  estimated_cost_usd: number;
  model_calls: number;
  segments: number;
  within_cap: boolean;
}

export interface Band {
  p10: number;
  p50: number;
  p90: number;
}

export interface SegmentShift {
  segment: string;
  topic: string;
  shift_p10: number;
  shift_p50: number;
  shift_p90: number;
  n_agents: number;
  tier: Tier;
}

export interface SimulateResult {
  simulated: true;
  disclosure: string;
  world_snapshot_id: string;
  engine_version: string;
  model: string;
  members: number;
  agents_sampled: number;
  days: number;
  cost: { estimated_usd: number; actual_usd: number };
  coverage: { iso3: string; tier: Tier }[];
  outputs: Record<
    string,
    { baseline_share: number; final: Band; by_day: (Band & { day: number })[] }
  >;
  segments: SegmentShift[];
  top_shifts: SegmentShift[];
  content_hash: string;
  note: string;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  request: SimulateRequest;
  result?: SimulateResult;
  error?: string;
}

export interface JobEvent {
  type: "progress" | "succeeded" | "failed";
  member?: number;
  members?: number;
  day?: number;
  days?: number;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API returned ${status}`);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) satisfies RequestInit;

export const world = () => call<World>("/v1/world");
export const agent = (id: string) => call<Agent>(`/v1/agents/${encodeURIComponent(id)}`);
export const agentWhy = (id: string) => call<AgentWhy>(`/v1/agents/${encodeURIComponent(id)}/why`);
export const daily = (playerId: string) =>
  call<Daily>(`/v1/daily?player_id=${encodeURIComponent(playerId)}`);
export const answerDaily = (question_id: string, player_id: string, probability: number) =>
  call<unknown>("/v1/daily/answers", post({ question_id, player_id, probability }));
export const receipts = () => call<{ days: ReceiptDaySummary[] }>("/v1/receipts");
export const receiptDay = (date: string) => call<ReceiptDay>(`/v1/receipts/${date}`);
export const scores = () => call<Scores>("/v1/scores");
export const estimate = (req: SimulateRequest) =>
  call<Estimate>("/v1/simulate/estimate", post(req));
export const simulate = (req: SimulateRequest) =>
  call<{ id: string; status: JobStatus }>(
    "/v1/simulate",
    post(req, { "Idempotency-Key": crypto.randomUUID() }),
  );
export const getSimulation = (id: string) => call<Job>(`/v1/simulations/${encodeURIComponent(id)}`);

// EventSource resumes with Last-Event-ID on its own; it is closed on a terminal event because
// otherwise it reconnects after the server ends the stream.
export function simulationEvents(id: string, onEvent: (e: JobEvent) => void): () => void {
  const es = new EventSource(`${API_URL}/v1/simulations/${encodeURIComponent(id)}/events`);
  es.onmessage = (m) => {
    const e = JSON.parse(m.data) as JobEvent;
    if (e.type !== "progress") es.close();
    onEvent(e);
  };
  return () => es.close();
}

"""HTTP over the rw engine: fork jobs, the world, agents, the daily question, receipts and scores.

The only package that speaks HTTP (decision 0001). Contracts: product/simulate-api.md,
product/daily-question.md, product/receipts.md and product/benchmark.md.
"""

import asyncio
import hashlib
import json
import secrets
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Annotated, Any, Literal

import numpy as np
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from rw import db, forecast, ledger, llm, population, score, settings, simulate

SCHEMA = Path(__file__).parent / "schema.sql"
IDEMPOTENCY_TTL = timedelta(hours=24)
HEARTBEAT_SECONDS = 15.0
POLL_SECONDS = 0.2
WHY_MAX_COST_USD = 0.01
WHY_LABEL = "Simulated account, not the cause"
# Vite moves to the next port when 5173 is taken, so any local port is a valid origin.
CORS_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1):\d+$"
TERMINAL = ("succeeded", "failed")

Status = Literal["queued", "running", "succeeded", "failed"]


class Links(BaseModel):
    self: str
    events: str


class JobCreated(BaseModel):
    id: str
    status: Status
    links: Links


class Job(BaseModel):
    id: str
    status: Status
    request: simulate.SimulateRequest
    result: simulate.SimulateResult | None = None
    error: str | None = None
    created_at: str
    finished_at: str | None = None


class Refused(BaseModel):
    detail: str
    estimate: simulate.Estimate


class Conflict(BaseModel):
    detail: str
    id: str


class Country(BaseModel):
    iso3: str
    name: str
    lat: float
    lng: float
    tier: str
    experimental: bool
    agent_count: int
    shares: dict[str, float]
    sample_agent_id: str


class PrefilledEvent(BaseModel):
    id: str
    text: str
    countries: list[str] | None


class World(BaseModel):
    date: str
    countries: list[Country]
    daily_question_id: str | None
    prefilled_events: list[PrefilledEvent]


class AgentStep(BaseModel):
    date: str
    topic: str
    delta: float = Field(description="Change in the agent's belief, in logit.")
    cause: str


class Agent(BaseModel):
    agent_id: str
    iso3: str
    tier: str
    segment: str
    traits: dict[str, str]
    shares: dict[str, float]
    moved: list[AgentStep]


class AgentWhy(BaseModel):
    agent_id: str
    text: str
    label: Literal["Simulated account, not the cause"] = WHY_LABEL
    simulated: Literal[True] = True


class DailyQuestion(BaseModel):
    id: str
    text: str
    resolution_source: str
    closes_at: str
    resolves_by: str


class Crowd(BaseModel):
    """Other visitors' answers; the caller's own answer is never in it."""

    mean: float | None
    count: int


class Reveal(BaseModel):
    you: float
    crowd: Crowd
    sim: float | None
    market: float | None
    outcome: int | None
    brier: float | None
    streak: int


class Daily(BaseModel):
    date: str
    question: DailyQuestion
    reveal: Reveal | None


class Answer(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question_id: str
    player_id: str = Field(min_length=1, max_length=64)
    probability: float = Field(ge=0, le=1)


class DayRecord(BaseModel):
    date: str
    prev_root: str
    root: str
    leaf_count: str
    protocol_hash: str
    engine_version: str


class DaySummary(DayRecord):
    record_hash: str
    anchored: bool


class Receipts(BaseModel):
    days: list[DaySummary]


class ReceiptEntry(BaseModel):
    entry: dict[str, Any]
    salt: str
    leaf_hash: str
    outcome: int | None
    brier: float | None


class ReceiptDay(BaseModel):
    day: DayRecord
    record_hash: str
    anchored: bool
    entries: list[ReceiptEntry]


class Skill(BaseModel):
    n: int
    n_pairs: int
    mean_diff: float | None
    low: float | None
    high: float | None
    claim: Literal["reportable", "insufficient_n"]


class BaselineSkill(Skill):
    by_tier: dict[str, Skill]
    by_region: dict[str, Skill]


def connect() -> sqlite3.Connection:
    conn = db.connect()
    db.apply(conn, SCHEMA)
    return conn


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def _share(logits: np.ndarray) -> float:
    return round(float((1 / (1 + np.exp(-logits))).mean()), 4)


def _event(conn: sqlite3.Connection, job_id: str, data: dict[str, Any]) -> None:
    conn.execute("INSERT INTO job_events (job_id, data) VALUES (?, ?)", (job_id, json.dumps(data)))


def _finish(
    conn: sqlite3.Connection,
    job_id: str,
    result: simulate.SimulateResult | None = None,
    error: str | None = None,
) -> None:
    status = "failed" if result is None else "succeeded"
    with conn:
        conn.execute(
            "UPDATE jobs SET status = ?, result_json = ?, error = ?, finished_at = ? WHERE id = ?",
            (status, result and result.model_dump_json(), error, _now(), job_id),
        )
        _event(conn, job_id, {"type": status} | ({"error": error} if error else {}))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    conn = connect()
    stale = conn.execute("SELECT id FROM jobs WHERE status IN ('queued', 'running')").fetchall()
    for (job_id,) in stale:
        _finish(conn, job_id, error="interrupted")
    conn.close()
    yield


app = FastAPI(
    title="Real World API",
    version=settings.API_VERSION,
    description="Every simulation result is labelled simulated. See product/simulate-api.md.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_job(job_id: str, req: simulate.SimulateRequest) -> None:
    conn = connect()
    with conn:
        conn.execute("UPDATE jobs SET status = 'running' WHERE id = ?", (job_id,))

    def progress(member: int, day: int) -> None:
        with conn:
            _event(
                conn,
                job_id,
                {
                    "type": "progress",
                    "member": member + 1,
                    "members": req.members,
                    "day": day,
                    "days": req.days,
                },
            )

    try:
        result = simulate.run(conn, req, progress)
    except Exception as e:
        _finish(conn, job_id, error=f"{type(e).__name__}: {e}")
    else:
        _finish(conn, job_id, result=result)
    finally:
        conn.close()


def _created(job_id: str, status: Status) -> JobCreated:
    path = f"/v1/simulations/{job_id}"
    return JobCreated(id=job_id, status=status, links=Links(self=path, events=f"{path}/events"))


def _replay(conn: sqlite3.Connection, key: str, body_sha: str) -> JobCreated | JSONResponse | None:
    cutoff = (datetime.now(UTC) - IDEMPOTENCY_TTL).isoformat(timespec="seconds")
    row = conn.execute(
        "SELECT k.body_sha256, j.id, j.status FROM idempotency_keys k"
        " JOIN jobs j ON j.id = k.job_id WHERE k.key = ? AND k.created_at >= ?",
        (key, cutoff),
    ).fetchone()
    if row is None:
        return None
    if row["body_sha256"] != body_sha:
        raise HTTPException(422, "this Idempotency-Key was used with a different body")
    if row["status"] not in TERMINAL:
        body = Conflict(detail="a job with this Idempotency-Key is still running", id=row["id"])
        return JSONResponse(body.model_dump(), status_code=409)
    return _created(row["id"], row["status"])


def _estimate(req: simulate.SimulateRequest) -> simulate.Estimate:
    try:
        return simulate.estimate(req)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e


@app.post(
    "/v1/simulate",
    status_code=202,
    response_model=JobCreated,
    responses={
        400: {"description": "Real-World-Version is not the current version"},
        402: {"model": Refused, "description": "The estimate exceeds max_cost_usd"},
        409: {"model": Conflict, "description": "A job with this Idempotency-Key is running"},
    },
)
def create_simulation(
    req: simulate.SimulateRequest,
    background: BackgroundTasks,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=255)],
    real_world_version: Annotated[str | None, Header(alias="Real-World-Version")] = None,
) -> JobCreated | JSONResponse:
    if real_world_version is not None and real_world_version != settings.API_VERSION:
        raise HTTPException(400, f"Real-World-Version must be {settings.API_VERSION}")
    body_sha = hashlib.sha256(req.model_dump_json().encode()).hexdigest()
    conn = connect()
    replay = _replay(conn, idempotency_key, body_sha)
    if replay is not None:
        return replay

    est = _estimate(req)
    if not est.within_cap:
        body = Refused(detail="the estimate exceeds max_cost_usd", estimate=est)
        return JSONResponse(body.model_dump(), status_code=402)

    job_id = f"job_{secrets.token_hex(8)}"
    cutoff = (datetime.now(UTC) - IDEMPOTENCY_TTL).isoformat(timespec="seconds")
    try:
        with conn:
            conn.execute(
                "DELETE FROM idempotency_keys WHERE key = ? AND created_at < ?",
                (idempotency_key, cutoff),
            )
            conn.execute(
                "INSERT INTO jobs (id, status, request_json, created_at)"
                " VALUES (?, 'queued', ?, ?)",
                (job_id, req.model_dump_json(), _now()),
            )
            conn.execute(
                "INSERT INTO idempotency_keys (key, body_sha256, job_id, created_at)"
                " VALUES (?, ?, ?, ?)",
                (idempotency_key, body_sha, job_id, _now()),
            )
    except sqlite3.IntegrityError:
        # A concurrent request with the same key committed first.
        replay = _replay(conn, idempotency_key, body_sha)
        if replay is None:
            raise
        return replay
    background.add_task(run_job, job_id, req)
    return _created(job_id, "queued")


@app.post("/v1/simulate/estimate", response_model=simulate.Estimate)
def estimate(req: simulate.SimulateRequest) -> simulate.Estimate:
    return _estimate(req)


@app.get("/v1/simulations/{job_id}", response_model=Job)
def get_simulation(job_id: str) -> Job:
    row = connect().execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if row is None:
        raise HTTPException(404, f"no simulation {job_id}")
    return Job(
        id=row["id"],
        status=row["status"],
        request=simulate.SimulateRequest.model_validate_json(row["request_json"]),
        result=row["result_json"]
        and simulate.SimulateResult.model_validate_json(row["result_json"]),
        error=row["error"],
        created_at=row["created_at"],
        finished_at=row["finished_at"],
    )


async def _stream(conn: sqlite3.Connection, job_id: str, after: int) -> AsyncIterator[str]:
    quiet = 0.0
    try:
        while True:
            rows = conn.execute(
                "SELECT id, data FROM job_events WHERE job_id = ? AND id > ? ORDER BY id",
                (job_id, after),
            ).fetchall()
            for r in rows:
                after = r["id"]
                yield f"id: {r['id']}\ndata: {r['data']}\n\n"
                if json.loads(r["data"])["type"] in TERMINAL:
                    return
            if not rows:
                status = conn.execute("SELECT status FROM jobs WHERE id = ?", (job_id,)).fetchone()
                if status[0] in TERMINAL:
                    return
            if rows:
                quiet = 0.0
            elif quiet >= HEARTBEAT_SECONDS:
                yield ": heartbeat\n\n"
                quiet = 0.0
            await asyncio.sleep(POLL_SECONDS)
            quiet += POLL_SECONDS
    finally:
        conn.close()


@app.get(
    "/v1/simulations/{job_id}/events",
    response_class=StreamingResponse,
    responses={200: {"content": {"text/event-stream": {}}, "description": "Server-sent events"}},
)
async def simulation_events(
    job_id: str, last_event_id: Annotated[str | None, Header(alias="Last-Event-ID")] = None
) -> StreamingResponse:
    conn = connect()
    if conn.execute("SELECT 1 FROM jobs WHERE id = ?", (job_id,)).fetchone() is None:
        conn.close()
        raise HTTPException(404, f"no simulation {job_id}")
    after = int(last_event_id) if last_event_id and last_event_id.isdigit() else 0
    return StreamingResponse(
        _stream(conn, job_id, after),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )


def _snapshot_dates() -> list[str]:
    found = (settings.rw_home() / "snapshots").glob("*/agents.parquet")
    return sorted(p.parent.name for p in found)


def _today(conn: sqlite3.Connection) -> str:
    row = conn.execute("SELECT max(date) FROM ledger_days").fetchone()
    if row[0] is None:
        raise HTTPException(404, "no committed day yet; run make daily-fixtures")
    return row[0]


def _daily_question(conn: sqlite3.Connection) -> tuple[str, dict[str, Any]]:
    day = _today(conn)
    for q in forecast.load_questions():
        if q.get("daily_on") == day:
            return day, q
    raise HTTPException(404, f"no daily question for {day}")


@app.get("/v1/world", response_model=World)
def world() -> World:
    dates = _snapshot_dates()
    if not dates:
        raise HTTPException(404, "no world snapshot yet; run make daily-fixtures")
    day = dates[-1]
    agents = population.read_snapshot(day)
    conn = connect()
    experimental = dict(
        conn.execute("SELECT iso3, experimental FROM country_status WHERE date = ?", (day,))
    )
    countries = []
    for c in population.countries():
        mask = agents["country"] == c["iso3"]
        if not mask.any():
            continue
        countries.append(
            Country(
                iso3=c["iso3"],
                name=c["name"],
                lat=float(c["lat"]),
                lng=float(c["lng"]),
                tier=population.coverage_tier(c),
                experimental=bool(experimental.get(c["iso3"], False)),
                agent_count=int(mask.sum()),
                shares={t: _share(agents[f"b_{t}"][mask]) for t in population.topics()},
                sample_agent_id=str(agents["agent_id"][mask][0]),
            )
        )
    try:
        question_id: str | None = _daily_question(conn)[1]["id"]
    except HTTPException:
        question_id = None
    prefilled = json.loads((forecast.FIXTURES / "prefilled_events.json").read_text())["events"]
    return World(
        date=day,
        countries=countries,
        daily_question_id=question_id,
        prefilled_events=[PrefilledEvent(id=e["id"], **e["event"]) for e in prefilled],
    )


def _agent(conn: sqlite3.Connection, agent_id: str) -> Agent:
    """The agent in the latest snapshot, with each day's belief change split into the news step,
    the poll nudge and the anchor pull, the same split daily.assimilate applies."""
    tps = population.topics()
    moved: list[AgentStep] = []
    prev: dict[str, float] | None = None
    found = None
    for day in _snapshot_dates():
        agents = population.read_snapshot(day)
        hit = np.flatnonzero(agents["agent_id"] == agent_id)
        if hit.size == 0:
            prev = None
            continue
        found = {name: values[hit[0]] for name, values in agents.items()}
        b = {t: float(found[f"b_{t}"]) for t in tps}
        b0 = {t: float(found[f"b0_{t}"]) for t in tps}
        # The first snapshot is assimilated from a fresh sample, whose beliefs start at the anchor.
        old = prev or b0
        nudges = dict(
            conn.execute(
                "SELECT topic, applied FROM nudges WHERE date = ? AND iso3 = ?",
                (day, found["country"]),
            )
        )
        signals = conn.execute(
            "SELECT title, topic, value, salience FROM signals WHERE date = ? AND iso3 = ?",
            (day, found["country"]),
        ).fetchall()
        for t in tps:
            anchor = settings.ANCHOR_PULL * (b0[t] - old[t])
            nudge = nudges.get(t, 0.0)
            news = b[t] - old[t] - anchor - nudge
            on_topic = [s for s in signals if s["topic"] == t]
            top = max(on_topic, key=lambda s: s["salience"] * abs(s["value"]), default=None)
            for delta, cause in (
                (news, "news" if top is None else top["title"]),
                (nudge, "nudge toward the day's polls"),
                (anchor, "anchor pull"),
            ):
                if round(delta, 6) != 0:
                    moved.append(AgentStep(date=day, topic=t, delta=round(delta, 6), cause=cause))
        prev = b
    if found is None or prev is None:
        raise HTTPException(404, f"no agent {agent_id} in the latest snapshot")
    return Agent(
        agent_id=agent_id,
        iso3=str(found["country"]),
        tier=str(found["tier"]),
        segment=str(found["segment"]),
        traits={k: str(found[k]) for k in ("age_band", "sex", "education", "urban")},
        shares={t: _share(np.array([prev[t]])) for t in tps},
        moved=moved,
    )


@app.get("/v1/agents/{agent_id}", response_model=Agent)
def agent(agent_id: str) -> Agent:
    return _agent(connect(), agent_id)


WHY_SCHEMA: llm.Schema = {
    "type": "object",
    "properties": {"text": {"type": "string"}},
    "required": ["text"],
    "additionalProperties": False,
}


@app.get(
    "/v1/agents/{agent_id}/why",
    response_model=AgentWhy,
    responses={402: {"description": "The model call would exceed its cost cap"}},
)
def agent_why(agent_id: str) -> AgentWhy:
    conn = connect()
    a = _agent(conn, agent_id)
    changes = "\n".join(f"- {s.date} {s.topic}: {s.delta:+.3f} ({s.cause})" for s in a.moved)
    prompt = (
        "You are a simulated person in a synthetic population, not a real person.\n"
        f"You are one of the {simulate.describe(a.segment)}.\n"
        "In two or three plain sentences in the first person, say how your views moved and why,"
        " using only the changes listed (logit steps, with the news or poll behind each)."
        " Do not invent events.\n"
        f"Changes:\n{changes or '- none'}"
    )
    try:
        out = llm.complete_json("why", prompt, WHY_SCHEMA, llm.Budget(WHY_MAX_COST_USD), conn=conn)
    except llm.BudgetExceeded as e:
        raise HTTPException(402, str(e)) from e
    return AgentWhy(agent_id=agent_id, text=out["text"])


def _streak(conn: sqlite3.Connection, player_id: str, day: str) -> int:
    answered = {
        r[0]
        for r in conn.execute("SELECT date FROM daily_answers WHERE player_id = ?", (player_id,))
    }
    d, n = date.fromisoformat(day), 0
    while d.isoformat() in answered:
        n, d = n + 1, d - timedelta(days=1)
    return n


def _daily(conn: sqlite3.Connection, player_id: str | None) -> Daily:
    day, q = _daily_question(conn)
    question = DailyQuestion(
        id=q["id"],
        text=q["text"],
        resolution_source=q["resolution_source"],
        closes_at=q["closes"],
        resolves_by=q["resolves_by"],
    )
    mine = conn.execute(
        "SELECT probability FROM daily_answers WHERE question_id = ? AND player_id = ?",
        (q["id"], player_id),
    ).fetchone()
    if player_id is None or mine is None:
        return Daily(date=day, question=question, reveal=None)
    you = float(mine[0])

    committed = {
        e["entry"]["forecaster"]: float(e["entry"]["probability"])
        for e in ledger.entries(conn, day)
        if e["entry"]["kind"] == "forecast" and e["entry"]["question_id"] == q["id"]
    }
    mean, count = conn.execute(
        "SELECT avg(probability), count(*) FROM daily_answers"
        " WHERE question_id = ? AND player_id != ?",
        (q["id"], player_id),
    ).fetchone()
    resolved = conn.execute(
        "SELECT outcome FROM resolutions WHERE question_id = ?", (q["id"],)
    ).fetchone()
    outcome = None if resolved is None else resolved[0]
    return Daily(
        date=day,
        question=question,
        reveal=Reveal(
            you=you,
            crowd=Crowd(mean=mean, count=count),
            sim=committed.get("sim"),
            market=committed.get("market"),
            outcome=outcome,
            brier=None if outcome is None else score.brier(you, outcome),
            streak=_streak(conn, player_id, day),
        ),
    )


@app.get("/v1/daily", response_model=Daily)
def daily(player_id: Annotated[str | None, Query(max_length=64)] = None) -> Daily:
    return _daily(connect(), player_id)


@app.post(
    "/v1/daily/answers",
    status_code=201,
    response_model=Daily,
    responses={409: {"description": "This player already answered this question"}},
)
def answer_daily(a: Answer) -> Daily:
    conn = connect()
    day, q = _daily_question(conn)
    if a.question_id != q["id"]:
        raise HTTPException(422, f"only today's question {q['id']} takes answers")
    try:
        with conn:
            conn.execute(
                "INSERT INTO daily_answers (question_id, player_id, date, probability, created_at)"
                " VALUES (?, ?, ?, ?, ?)",
                (a.question_id, a.player_id, day, a.probability, _now()),
            )
    except sqlite3.IntegrityError as e:
        raise HTTPException(409, f"player already answered {a.question_id}") from e
    return _daily(conn, a.player_id)


@app.get("/v1/receipts", response_model=Receipts)
def receipts() -> Receipts:
    rows = connect().execute("SELECT * FROM ledger_days ORDER BY date DESC").fetchall()
    return Receipts(
        days=[
            DaySummary(**ledger._day_record(r), record_hash=r["record_hash"], anchored=False)
            for r in rows
        ]
    )


@app.get("/v1/receipts/{day}", response_model=ReceiptDay)
def receipt_day(day: str) -> ReceiptDay:
    conn = connect()
    row = ledger._day_row(conn, day)
    if row is None:
        raise HTTPException(404, f"no committed day {day}")
    outcomes = dict(conn.execute("SELECT question_id, outcome FROM resolutions"))
    briers = {
        (r[0], r[1]): r[2]
        for r in conn.execute(
            "SELECT question_id, forecaster, brier FROM scores WHERE date = ?", (day,)
        )
    }
    receipt = ledger._receipt(conn, row)
    entries = []
    for item in receipt["entries"]:
        e = item["entry"]
        key = (e.get("question_id"), e.get("forecaster"))
        entries.append(ReceiptEntry(**item, outcome=outcomes.get(key[0]), brier=briers.get(key)))
    return ReceiptDay(
        day=DayRecord(**receipt["day"]),
        record_hash=receipt["record_hash"],
        anchored=False,
        entries=entries,
    )


@app.get("/v1/scores", response_model=dict[str, BaselineSkill])
def scores() -> dict[str, Any]:
    """score.summarize over every committed forecast whose question has resolved. A question
    across several countries takes its lowest-coverage tier, and "multiple" as its region when
    they differ."""
    conn = connect()
    resolved = dict(conn.execute("SELECT question_id, outcome FROM resolutions"))
    questions = {q["id"]: q for q in forecast.load_questions()}
    countries = {c["iso3"]: c for c in population.countries()}
    rows = []
    for (day,) in conn.execute("SELECT date FROM ledger_days ORDER BY date").fetchall():
        for leaf in ledger.entries(conn, day):
            e = leaf["entry"]
            if e["kind"] != "forecast" or e["question_id"] not in resolved:
                continue
            cs = [countries[iso3] for iso3 in questions[e["question_id"]]["countries"]]
            regions = {c["region"] for c in cs}
            rows.append(
                {
                    "date": e["date"],
                    "question_id": e["question_id"],
                    "forecaster": e["forecaster"],
                    "probability": float(e["probability"]),
                    "outcome": resolved[e["question_id"]],
                    "tier": max(population.coverage_tier(c) for c in cs),
                    "region": regions.pop() if len(regions) == 1 else "multiple",
                }
            )
    return score.summarize(rows, score.load_protocol())


@app.get("/healthz")
def healthz() -> dict[str, bool]:
    return {"ok": True}


if __name__ == "__main__":
    print(json.dumps(app.openapi(), indent=2))

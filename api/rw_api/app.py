"""HTTP over the rw engine: forks, the world, agents, the daily question, receipts and scores.

The only package that speaks HTTP (decision 0001). Contracts: product/simulate-api.md,
product/daily-question.md, product/receipts.md and product/benchmark.md.
"""

import asyncio
import base64
import hashlib
import json
import logging
import os
import re
import secrets
import sqlite3
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Annotated, Any, Literal

import numpy as np
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, RedirectResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from rw import db, forecast, ledger, llm, policy, population, score, settings, simulate
from rw_api import routes_cycle

log = logging.getLogger("rw_api")
SCHEMA = Path(__file__).parent / "schema.sql"
SQL_DIR = Path(__file__).parent / "sql"
IDEMPOTENCY_TTL = timedelta(hours=24)
HEARTBEAT_SECONDS = 15.0
POLL_SECONDS = 0.2
WHY_MAX_COST_USD = 0.01
WHY_LABEL = "Simulated account, not the cause"
# Vite moves to the next port when 5173 is taken, so any local port is a valid origin. Other
# origins come from RW_ALLOWED_ORIGINS.
CORS_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1):\d+$"
TERMINAL = ("succeeded", "failed")
KEY_HEADER = (
    "Bearer rw_... API key. Without one the caller is anonymous and max_cost_usd is clamped."
)

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


RefusedCode = Literal[
    "over_max_cost",
    "fork_budget_spent",
    "anon_daily_limit",
    "client_unknown",
    "spend_unreadable",
    "invalid_api_key",
    "key_cap_spent",
    "idempotency_key_running",
    "invalid_request",
    "unsupported_version",
    "acceptable_use_unreadable",
    "idempotency_key_reused",
    "why_over_cap",
    "wrong_question",
    "answers_closed",
    "already_answered",
    "sign_in_throttled",
    "email_unavailable",
    "sign_in_invalid",
    "signed_out",
    "cross_origin",
    "account_unreadable",
    "test_daily_limit",
    "already_marked",
]


class Refused(BaseModel):
    code: RefusedCode
    detail: str = Field(description="One sentence saying what was refused and why, for display.")
    estimate: simulate.Estimate | None = None
    id: str | None = Field(
        default=None, description="The fork already running under this Idempotency-Key."
    )


class NotFound(BaseModel):
    detail: str


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
    provider: str = Field(
        description='Who wrote the text: "openai_compatible", or "fake" (no model ran).'
    )
    label: Literal["Simulated account, not the cause"] = WHY_LABEL
    simulated: Literal[True] = True


class DailyQuestion(BaseModel):
    id: str
    text: str
    resolution_source: str
    closes_at: str
    resolves_by: str


class Crowd(BaseModel):
    mean: float | None = Field(
        description="Mean of other visitors' answers; null if there are none."
    )
    count: int = Field(description="Other visitors' answers; the caller's own is never counted.")


class WeekDay(BaseModel):
    date: str
    probability: float | None = Field(description="The visitor's answer that day; null if none.")
    brier: float | None = Field(description="Its Brier score once the question resolved.")


class VsAi(BaseModel):
    n: int = Field(description="Resolved questions this player called that the AI also called.")
    you: float | None = Field(description="The player's mean Brier on them.")
    ai: float | None = Field(description="The AI's (sim) mean Brier on the same questions.")
    wins: int = Field(description="Questions where the player's Brier was lower than the AI's.")


class Sealed(BaseModel):
    leaf_hash: str = Field(description="The AI's committed sim forecast leaf, its number hidden.")
    date: str = Field(description="The day record it is committed in.")


class Reveal(BaseModel):
    you: float
    crowd: Crowd
    sim: float | None
    market: float | None
    outcome: int | None
    brier: float | None
    streak: int
    week: list[WeekDay] = Field(description="The seven days ending today, oldest first.")
    record: VsAi


class Daily(BaseModel):
    date: str
    question: DailyQuestion
    sealed: Sealed | None = Field(description="The AI's call on this question, sealed.")
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
    anchor: ledger.AnchorStatus
    anchored_at: str | None


class Anchor(BaseModel):
    kind: Literal["rfc3161", "opentimestamps"]
    service: str
    requested_at: str
    proof_base64: str


class Receipts(BaseModel):
    days: list[DaySummary]


class ReceiptQuestion(BaseModel):
    text: str
    resolution_source: str
    resolves_by: str


class ReceiptEntry(BaseModel):
    entry: dict[str, Any]
    salt: str
    leaf_hash: str
    question: ReceiptQuestion | None = Field(
        description="The forecast's question from its committed question set; null on other leaves."
    )
    outcome: int | None
    brier: float | None


class ReceiptDay(BaseModel):
    day: DayRecord
    record_hash: str
    anchor: ledger.AnchorStatus
    anchored_at: str | None
    anchors: list[Anchor]
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


INVALID: dict[str, Any] = {"model": Refused, "description": "The request is invalid"}


def not_found(what: str) -> dict[str, Any]:
    return {"model": NotFound, "description": f"No such {what}"}


def connect() -> sqlite3.Connection:
    conn = db.connect()
    db.apply(conn, SCHEMA)
    for path in sorted(SQL_DIR.glob("*.sql")):
        db.apply(conn, path)
    return conn


def _clock() -> datetime:
    return datetime.now(UTC)


def _now() -> str:
    return _clock().isoformat(timespec="seconds")


def _closes(q: dict[str, Any]) -> datetime:
    """A date-only `closes` means the start of that UTC day, as the web app reads it."""
    closes = datetime.fromisoformat(q["closes"])
    return closes if closes.tzinfo else closes.replace(tzinfo=UTC)


def _closed(q: dict[str, Any]) -> bool:
    return _clock() >= _closes(q)


def _share(logits: np.ndarray) -> float:
    return round(float((1 / (1 + np.exp(-logits))).mean()), 4)


def _event(conn: sqlite3.Connection, job_id: str, data: dict[str, Any]) -> None:
    conn.execute("INSERT INTO job_events (job_id, data) VALUES (?, ?)", (job_id, json.dumps(data)))


def _finish(
    conn: sqlite3.Connection,
    job_id: str,
    result: simulate.SimulateResult | None = None,
    error: str | None = None,
    spent_usd: float | None = None,
) -> None:
    status = "failed" if result is None else "succeeded"
    with conn:
        conn.execute(
            "UPDATE jobs SET status = ?, result_json = ?, error = ?, finished_at = ? WHERE id = ?",
            (status, result and result.model_dump_json(), error, _now(), job_id),
        )
        conn.execute("UPDATE key_forks SET spent_usd = ? WHERE job_id = ?", (spent_usd, job_id))
        _event(conn, job_id, {"type": status} | ({"error": error} if error else {}))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    auth.require_email_transport(allowed_origins())
    settings.test_agents()  # a bad agent setting stops startup
    settings.test_agent_workers()
    conn = connect()
    stale = conn.execute("SELECT id FROM jobs WHERE status IN ('queued', 'running')").fetchall()
    for (job_id,) in stale:
        _finish(conn, job_id, error="the server restarted before the fork finished")
    conn.close()
    yield


app = FastAPI(
    title="Real World API",
    version=settings.API_VERSION,
    description=(
        "Simulations with receipts. AI simulates how the world reacts to the news. Every forecast"
        " is sealed before the outcome and scored in public. A forecast and simulation API with a"
        " public score: fork today's simulated world, read its agents, answer the daily question"
        " and check the hashed receipts. Get a key with a dollar cap; every refusal is one"
        " sentence in `detail`, and every output is labelled AI-simulated."
    ),
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, e: RequestValidationError) -> JSONResponse:
    parts = [f"{'.'.join(str(p) for p in err['loc'])}: {err['msg']}" for err in e.errors()]
    return _refuse(422, "invalid_request", "invalid request: " + "; ".join(parts))


def env_list(name: str) -> list[str]:
    return [v.strip() for v in os.environ.get(name, "").split(",") if v.strip()]


def allowed_origins() -> list[str]:
    """RW_ALLOWED_ORIGINS, comma-separated; empty means localhost only. A malformed entry stops
    the app at startup instead of quietly blocking the origin."""
    origins = env_list("RW_ALLOWED_ORIGINS")
    bad = [o for o in origins if not re.fullmatch(r"https?://[^/\s]+", o)]
    if bad:
        raise ValueError(f"RW_ALLOWED_ORIGINS entries are not origins like https://host: {bad}")
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
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

    budget = llm.Budget(req.max_cost_usd)
    try:
        result = simulate.run(conn, req, progress, budget)
    except Exception as e:
        log.exception("fork %s failed", job_id)
        error = (
            "the fork passed its cost cap and was stopped"
            if isinstance(e, llm.BudgetExceeded)
            else "the fork stopped on an error and produced no result"
        )
        _finish(conn, job_id, error=error, spent_usd=budget.spent_usd)
    else:
        _finish(conn, job_id, result=result, spent_usd=budget.spent_usd)
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
        return _refuse(
            409, "idempotency_key_reused", "this Idempotency-Key was used with a different body"
        )
    if row["status"] not in TERMINAL:
        return _refuse(
            409,
            "idempotency_key_running",
            "a fork with this Idempotency-Key is still running",
            id=row["id"],
        )
    return _created(row["id"], row["status"])


def _estimate(req: simulate.SimulateRequest) -> simulate.Estimate | JSONResponse:
    try:
        return simulate.estimate(req)
    except ValueError:
        log.warning("fork estimate refused", exc_info=True)
        return _refuse(
            422,
            "invalid_request",
            "no agents can be sampled for this world and event; check world and countries",
        )


def _capped(req: simulate.SimulateRequest, key: int | None) -> simulate.SimulateRequest:
    """An anonymous caller's max_cost_usd is clamped to the default; a keyed one's is not."""
    if key is not None:
        return req
    cap = min(req.max_cost_usd, settings.FORK_MAX_COST_USD_DEFAULT)
    return req.model_copy(update={"max_cost_usd": cap})


def _refuse(
    status: int,
    code: RefusedCode,
    detail: str,
    est: simulate.Estimate | None = None,
    id: str | None = None,
) -> JSONResponse:
    body = Refused(code=code, detail=detail, estimate=est, id=id)
    return JSONResponse(body.model_dump(exclude=None if id else {"id"}), status_code=status)


def _key(conn: sqlite3.Connection, authorization: str | None) -> int | JSONResponse | None:
    """The id of the live key sent as `Authorization: Bearer rw_...`; None without the header."""
    if authorization is None:
        return None
    scheme, _, token = authorization.partition(" ")
    try:
        row = conn.execute(
            "SELECT id FROM api_keys WHERE key_sha256 = ? AND revoked_at IS NULL",
            (hashlib.sha256(token.strip().encode()).hexdigest(),),
        ).fetchone()
    except Exception:
        log.exception("api key lookup failed")
        return _refuse(503, "spend_unreadable", "the API key could not be checked")
    if scheme.lower() != "bearer" or row is None:
        return _refuse(401, "invalid_api_key", "this API key is unknown or revoked")
    return row[0]


def key_spent(conn: sqlite3.Connection, key: int) -> float:
    """What a key's screens and forks have cost, counting each unfinished or interrupted fork at
    its cap."""
    return conn.execute(
        "SELECT (SELECT COALESCE(SUM(COALESCE(k.spent_usd, json_extract(j.request_json,"
        " '$.max_cost_usd'))), 0) FROM key_forks k JOIN jobs j ON j.id = k.job_id"
        " WHERE k.api_key_id = ?1)"
        " + (SELECT COALESCE(SUM(spent_usd), 0) FROM key_screens WHERE api_key_id = ?1)",
        (key,),
    ).fetchone()[0]


def _client(request: Request) -> str | None:
    """A hash of the caller's address: the peer, or the last X-Forwarded-For hop when the peer is
    a proxy listed in RW_TRUSTED_PROXIES. None when there is no address to key on."""
    ip = request.client.host if request.client else None
    if ip is not None and ip in env_list("RW_TRUSTED_PROXIES"):
        hops = ",".join(request.headers.getlist("x-forwarded-for")).split(",")
        ip = hops[-1].strip() or None
    return ip and hashlib.sha256(ip.encode()).hexdigest()


def _limits(
    conn: sqlite3.Connection, client: str | None, key: int | None, reserve: float
) -> JSONResponse | None:
    """Refuse when an anonymous client has started FORK_ANON_PER_DAY forks today, when a key's
    spend plus reserve would pass its cap, or when today's public spend plus the cap of every
    unfinished fork plus reserve would pass FORK_DAILY_BUDGET_USD. A keyed caller passes client
    None, an anonymous one key None."""
    cap, spent = None, 0.0
    try:
        started = conn.execute(
            "SELECT count(*) FROM fork_clients WHERE client_sha256 = ? AND day = ?",
            (client, _clock().date().isoformat()),
        ).fetchone()[0]
        pending = conn.execute(
            "SELECT COALESCE(SUM(json_extract(request_json, '$.max_cost_usd')), 0) FROM jobs"
            " WHERE status IN ('queued', 'running')"
        ).fetchone()[0]
        left = settings.FORK_DAILY_BUDGET_USD - llm.spent_today(conn, public=True) - pending
        if key is not None:
            row = conn.execute(
                "SELECT cap_usd FROM api_keys WHERE id = ? AND revoked_at IS NULL", (key,)
            ).fetchone()
            cap, spent = row and row[0], key_spent(conn, key)
    except Exception:
        log.exception("fork spend read failed")
        return _refuse(503, "spend_unreadable", "today's fork spend could not be read")
    if key is not None:
        if cap is None:
            return _refuse(401, "invalid_api_key", "this API key is unknown or revoked")
        if not spent + reserve <= cap:
            so_far = llm.cost_text(spent, llm.decider().name)
            return _refuse(
                402,
                "key_cap_spent",
                f"this API key's ${cap:g} cap would be passed: {so_far} so far, and this fork"
                f" may cost up to ${reserve:g}",
            )
    elif started >= settings.FORK_ANON_PER_DAY:
        return _refuse(
            429,
            "anon_daily_limit",
            f"this address has started {settings.FORK_ANON_PER_DAY} forks today, the limit"
            " without an API key; try again after 00:00 UTC",
        )
    if not reserve <= left:
        return _refuse(
            402, "fork_budget_spent", "today's fork budget is spent; try again after 00:00 UTC"
        )
    return None


@app.post(
    "/v1/simulate",
    summary="Start a fork: add one event to today's world and run it forward. Returns an id.",
    status_code=202,
    response_model=JobCreated,
    responses={
        401: {"model": Refused, "description": "The API key is unknown or revoked"},
        402: {
            "model": Refused,
            "description": "The estimate exceeds max_cost_usd, the key's cap or today's fork"
            " budget is spent",
        },
        409: {
            "model": Refused,
            "description": "This Idempotency-Key is running a fork, or was used with another body",
        },
        422: {
            "model": policy.PolicyRefused,
            "description": "The request is invalid, Real-World-Version is not the current"
            " version, or the event breaks the acceptable-use policy",
        },
        429: {"model": Refused, "description": "This address has used today's anonymous forks"},
        503: {
            "model": Refused,
            "description": "A spend, address or acceptable-use check could not run; nothing was"
            " started",
        },
    },
)
def create_simulation(
    req: simulate.SimulateRequest,
    request: Request,
    background: BackgroundTasks,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=1, max_length=255)],
    real_world_version: Annotated[str | None, Header(alias="Real-World-Version")] = None,
    authorization: Annotated[
        str | None, Header(alias="Authorization", description=KEY_HEADER)
    ] = None,
) -> JobCreated | JSONResponse:
    if real_world_version is not None and real_world_version != settings.API_VERSION:
        return _refuse(
            422, "unsupported_version", f"Real-World-Version must be {settings.API_VERSION}"
        )
    conn = connect()
    key = _key(conn, authorization)
    if isinstance(key, JSONResponse):
        return key
    req = _capped(req, key)
    body_sha = hashlib.sha256(req.model_dump_json().encode()).hexdigest()
    replay = _replay(conn, idempotency_key, body_sha)
    if replay is not None:
        return replay

    client = None
    if key is None:
        client = _client(request)
        if client is None:
            return _refuse(503, "client_unknown", "the caller's address could not be read")
    # A keyed caller also pays for the screen below, so its cap must hold that call too.
    screen_reserve = 0.0 if key is None else settings.SCREEN_MAX_COST_USD
    refusal = _limits(conn, client, key, req.max_cost_usd + screen_reserve)
    if refusal is not None:
        return refusal
    est = _estimate(req)
    if isinstance(est, JSONResponse):
        return est
    if not est.within_cap:
        return _refuse(
            402,
            "over_max_cost",
            f"the estimate ${est.estimated_cost_usd:.4f} exceeds the"
            f" ${req.max_cost_usd:g} cost cap",
            est,
        )

    screen_budget = llm.Budget(settings.SCREEN_MAX_COST_USD)
    try:
        refusal = policy.screen(req.event.text, conn, budget=screen_budget)
    except Exception:
        log.exception("acceptable-use screen failed")
        return _refuse(
            503,
            "acceptable_use_unreadable",
            "the acceptable-use check could not run; nothing was started",
        )
    finally:
        if key is not None and screen_budget.spent_usd > 0:
            with conn:
                conn.execute(
                    "INSERT INTO key_screens (api_key_id, spent_usd, created_at) VALUES (?, ?, ?)",
                    (key, screen_budget.spent_usd, _now()),
                )
    if refusal is not None:
        return JSONResponse(refusal.model_dump(), status_code=422)

    job_id = f"job_{secrets.token_hex(8)}"
    cutoff = (datetime.now(UTC) - IDEMPOTENCY_TTL).isoformat(timespec="seconds")
    try:
        with conn:
            # The write lock makes the second limits check and the insert one step, so concurrent
            # requests cannot all pass on the same remaining budget.
            conn.execute("BEGIN IMMEDIATE")
            refusal = _limits(conn, client, key, req.max_cost_usd)
            if refusal is not None:
                return refusal
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
            if key is None:
                conn.execute(
                    "INSERT INTO fork_clients (job_id, client_sha256, day) VALUES (?, ?, ?)",
                    (job_id, client, _clock().date().isoformat()),
                )
            else:
                conn.execute(
                    "INSERT INTO key_forks (job_id, api_key_id) VALUES (?, ?)", (job_id, key)
                )
    except sqlite3.IntegrityError:
        # A concurrent request with the same key committed first.
        replay = _replay(conn, idempotency_key, body_sha)
        if replay is None:
            raise
        return replay
    background.add_task(run_job, job_id, req)
    return _created(job_id, "queued")


@app.post(
    "/v1/simulate/estimate",
    summary="Estimate a fork's cost and model calls without running it",
    response_model=simulate.Estimate,
    responses={
        401: {"model": Refused, "description": "The API key is unknown or revoked"},
        422: INVALID,
        503: {"model": Refused, "description": "The API key could not be checked"},
    },
)
def estimate(
    req: simulate.SimulateRequest,
    authorization: Annotated[
        str | None, Header(alias="Authorization", description=KEY_HEADER)
    ] = None,
) -> simulate.Estimate | JSONResponse:
    key = None if authorization is None else _key(connect(), authorization)
    if isinstance(key, JSONResponse):
        return key
    return _estimate(_capped(req, key))


@app.get(
    "/v1/simulations/{job_id}",
    summary="A fork's status, and its result when done",
    response_model=Job,
    responses={404: not_found("fork"), 422: INVALID},
)
def get_simulation(job_id: str) -> Job:
    row = connect().execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if row is None:
        raise HTTPException(404, f"no fork {job_id}")
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
    summary="Stream a fork's progress as server-sent events; resumes from Last-Event-ID",
    response_class=StreamingResponse,
    responses={
        200: {"content": {"text/event-stream": {}}, "description": "Server-sent events"},
        404: not_found("fork"),
        422: INVALID,
    },
)
async def simulation_events(
    job_id: str,
    last_event_id: Annotated[str | None, Header(alias="Last-Event-ID")] = None,
) -> StreamingResponse:
    conn = connect()
    if conn.execute("SELECT 1 FROM jobs WHERE id = ?", (job_id,)).fetchone() is None:
        conn.close()
        raise HTTPException(404, f"no fork {job_id}")
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
        raise HTTPException(404, "no day committed yet")
    return row[0]


def _daily_question(conn: sqlite3.Connection) -> tuple[str, dict[str, Any]]:
    """The day's own question while it is open, then the open question that day forecast with the
    soonest close, so the reveal's `sim` is always a committed forecast. A later day's own question
    is never the fallback: once that day runs, an answer to it would be stored under the wrong day.
    When all have closed it stays the day's own question, which refuses answers."""
    day = _today(conn)
    questions = forecast.load_questions()
    own = next((q for q in questions if q.get("daily_on") == day), None)
    if own is None:
        raise HTTPException(404, f"no daily question for {day}")
    if not _closed(own):
        return day, own
    committed = {
        e["entry"]["question_id"]
        for e in ledger.entries(conn, day)
        if e["entry"]["kind"] == "forecast"
    }
    still_open = [
        q
        for q in questions
        if q["id"] in committed and q.get("daily_on") in (None, "", day) and not _closed(q)
    ]
    return day, min(still_open, key=_closes, default=own)


@app.get(
    "/v1/world",
    summary="Today's world: countries, tiers, topic shares and prefilled fork events",
    response_model=World,
    responses={404: not_found("world snapshot")},
)
def world() -> World:
    dates = _snapshot_dates()
    if not dates:
        raise HTTPException(404, "no world snapshot committed yet")
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
    the poll nudge and the anchor pull toward b0 plus the previous day's assimilated offset, the
    same split daily.assimilate applies."""
    tps = population.topics()
    moved: list[AgentStep] = []
    prev: dict[str, float] | None = None
    offset = {t: 0.0 for t in tps}
    found = None
    for day in _snapshot_dates():
        agents = population.read_snapshot(day)
        hit = np.flatnonzero(agents["agent_id"] == agent_id)
        if hit.size == 0:
            prev = None
            offset = {t: 0.0 for t in tps}
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
            anchor = settings.ANCHOR_PULL * (b0[t] + offset[t] - old[t])
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
        offset = {t: float(found.get(f"c_{t}", 0.0)) for t in tps}
    if found is None or prev is None:
        raise HTTPException(404, f"no agent {agent_id} in the latest world snapshot")
    return Agent(
        agent_id=agent_id,
        iso3=str(found["country"]),
        tier=str(found["tier"]),
        segment=str(found["segment"]),
        traits={k: str(found[k]) for k in ("age_band", "sex", "education", "urban")},
        shares={t: _share(np.array([prev[t]])) for t in tps},
        moved=moved,
    )


@app.get(
    "/v1/agents/{agent_id}",
    summary="One simulated agent: traits, beliefs and what moved them",
    response_model=Agent,
    responses={404: not_found("agent"), 422: INVALID},
)
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
    summary="A short model-written account of what moved one agent, labelled simulated",
    response_model=AgentWhy,
    responses={
        402: {"model": Refused, "description": "The model call would exceed its cost cap"},
        404: not_found("agent"),
        422: INVALID,
    },
)
def agent_why(agent_id: str) -> AgentWhy | JSONResponse:
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
    except llm.BudgetExceeded:
        log.warning("agent account refused over its cost cap", exc_info=True)
        return _refuse(
            402, "why_over_cap", "the account would pass its cost cap, so it was not written"
        )
    return AgentWhy(agent_id=agent_id, text=out["text"], provider=llm.provider().name)


def _streak(conn: sqlite3.Connection, player_id: str, day: str) -> int:
    answered = {
        r[0]
        for r in conn.execute("SELECT date FROM daily_answers WHERE player_id = ?", (player_id,))
    }
    d, n = date.fromisoformat(day), 0
    while d.isoformat() in answered:
        n, d = n + 1, d - timedelta(days=1)
    return n


def _week(conn: sqlite3.Connection, player_id: str, day: str, question_id: str) -> list[WeekDay]:
    """A day with several answers shows the answer to question_id, else the latest one."""
    end = date.fromisoformat(day)
    days = [(end - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    rows = {
        r[0]: (r[1], r[2])
        for r in conn.execute(
            "SELECT a.date, a.probability, r.outcome FROM daily_answers a"
            " LEFT JOIN resolutions r USING (question_id)"
            " WHERE a.player_id = ? AND a.date BETWEEN ? AND ?"
            " ORDER BY a.question_id = ?, a.created_at, a.rowid",
            (player_id, days[0], day, question_id),
        )
    }
    week = []
    for d in days:
        p, outcome = rows.get(d, (None, None))
        brier = None if p is None or outcome is None else score.brier(p, outcome)
        week.append(WeekDay(date=d, probability=p, brier=brier))
    return week


def _sim_leaf(conn: sqlite3.Connection, day: str, question_id: str) -> dict[str, Any] | None:
    for e in ledger.entries(conn, day):
        entry = e["entry"]
        if (entry["kind"], entry.get("forecaster"), entry.get("question_id")) == (
            "forecast",
            "sim",
            question_id,
        ):
            return e
    return None


def _vs_ai(conn: sqlite3.Connection, player_id: str) -> VsAi:
    """Each resolved question the player answered, scored against the sim forecast committed on
    the day of the answer."""
    rows = conn.execute(
        "SELECT a.date, a.question_id, a.probability, r.outcome FROM daily_answers a"
        " JOIN resolutions r USING (question_id) WHERE a.player_id = ?",
        (player_id,),
    ).fetchall()
    pairs = []
    for day, qid, p, outcome in rows:
        leaf = _sim_leaf(conn, day, qid)
        if leaf is not None:
            ai = float(leaf["entry"]["probability"])
            pairs.append((score.brier(p, outcome), score.brier(ai, outcome)))
    n = len(pairs)
    return VsAi(
        n=n,
        you=sum(y for y, _ in pairs) / n if n else None,
        ai=sum(a for _, a in pairs) / n if n else None,
        wins=sum(y < a for y, a in pairs),
    )


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
    leaf = _sim_leaf(conn, day, q["id"])
    sealed = None if leaf is None else Sealed(leaf_hash=leaf["leaf_hash"], date=day)
    if player_id is None or mine is None:
        return Daily(date=day, question=question, sealed=sealed, reveal=None)
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
        sealed=sealed,
        reveal=Reveal(
            you=you,
            crowd=Crowd(mean=mean, count=count),
            sim=committed.get("sim"),
            market=committed.get("market"),
            outcome=outcome,
            brier=None if outcome is None else score.brier(you, outcome),
            streak=_streak(conn, player_id, day),
            week=_week(conn, player_id, day, q["id"]),
            record=_vs_ai(conn, player_id),
        ),
    )


@app.get(
    "/v1/daily",
    summary="Today's question, and the reveal once this visitor answered",
    response_model=Daily,
    responses={404: not_found("daily question"), 422: INVALID},
)
def daily(player_id: Annotated[str | None, Query(max_length=64)] = None) -> Daily:
    return _daily(connect(), player_id)


@app.post(
    "/v1/daily/answers",
    summary="Answer today's question once; returns the reveal",
    status_code=201,
    response_model=Daily,
    responses={
        404: not_found("daily question"),
        409: {"model": Refused, "description": "This visitor already answered, or answers closed"},
        422: {"model": Refused, "description": "The request is invalid or not today's question"},
    },
)
def answer_daily(a: Answer) -> Daily | JSONResponse:
    conn = connect()
    day, q = _daily_question(conn)
    if a.question_id != q["id"]:
        return _refuse(422, "wrong_question", f"only today's question {q['id']} takes answers")
    if _closed(q):
        return _refuse(409, "answers_closed", f"answers for {q['id']} closed at {q['closes']}")
    try:
        with conn:
            conn.execute(
                "INSERT INTO daily_answers (question_id, player_id, date, probability, created_at)"
                " VALUES (?, ?, ?, ?, ?)",
                (a.question_id, a.player_id, day, a.probability, _now()),
            )
    except sqlite3.IntegrityError:
        return _refuse(409, "already_answered", f"this visitor already answered {a.question_id}")
    return _daily(conn, a.player_id)


@app.get(
    "/v1/receipts",
    summary="Every day record, newest first, with its root, record hash and anchor status",
    response_model=Receipts,
)
def receipts() -> Receipts:
    conn = connect()
    rows = conn.execute("SELECT * FROM ledger_days ORDER BY date DESC").fetchall()
    days = []
    for r in rows:
        anchor, at = ledger.anchor_status(conn, r["date"])
        days.append(
            DaySummary(
                **ledger._day_record(r), record_hash=r["record_hash"], anchor=anchor, anchored_at=at
            )
        )
    return Receipts(days=days)


@app.get(
    "/v1/receipts/{day}",
    summary="One day record with every receipt in it: entry, salt and leaf hash",
    response_model=ReceiptDay,
    responses={404: not_found("day record"), 422: INVALID},
)
def receipt_day(day: str) -> ReceiptDay:
    conn = connect()
    row = ledger._day_row(conn, day)
    if row is None:
        raise HTTPException(404, f"no day record for {day}")
    outcomes = dict(conn.execute("SELECT question_id, outcome FROM resolutions"))
    briers = {
        (r[0], r[1]): r[2]
        for r in conn.execute(
            "SELECT question_id, forecaster, brier FROM scores WHERE date = ?", (day,)
        )
    }
    receipt = ledger._receipt(conn, row)
    questions = {q["id"]: q for q in forecast.load_questions()}
    entries = []
    for item in receipt["entries"]:
        e = item["entry"]
        key = (e.get("question_id"), e.get("forecaster"))
        q = questions.get(key[0]) if key[0] else None
        entries.append(
            ReceiptEntry(
                **item,
                question=None if q is None else ReceiptQuestion(**q),
                outcome=outcomes.get(key[0]),
                brier=briers.get(key),
            )
        )
    anchor, at = ledger.anchor_status(conn, day)
    return ReceiptDay(
        day=DayRecord(**receipt["day"]),
        record_hash=receipt["record_hash"],
        anchor=anchor,
        anchored_at=at,
        anchors=[
            Anchor(
                kind=a["kind"],
                service=a["service"],
                requested_at=a["requested_at"],
                proof_base64=base64.b64encode(a["proof"]).decode(),
            )
            for a in ledger.anchors(conn, day)
        ],
        entries=entries,
    )


@app.get(
    "/v1/scores",
    summary="How our simulation's forecasts score against each baseline",
    description=(
        "Mean Brier difference of the sim forecaster against the plain LLM and the market over"
        " resolved questions, with n, an interval and whether the sample is large enough to"
        " report, overall and by coverage tier and region."
    ),
    response_model=dict[str, BaselineSkill],
)
def scores() -> dict[str, Any]:
    # A question across several countries takes its lowest-coverage tier, and "multiple" as its
    # region when they differ.
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


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse("/docs")


@app.get("/llms.txt", include_in_schema=False)
def llms_txt() -> PlainTextResponse:
    """The API in plain text for a model to read: the same summaries as /docs, one per line."""
    spec = app.openapi()
    lines = [f"# {spec['info']['title']}", "", spec["info"]["description"].strip(), ""]
    lines += [
        f"- {method.upper()} {path}: {op['summary']}"
        for path, methods in spec["paths"].items()
        for method, op in methods.items()
    ]
    lines += ["", "Full schema: /openapi.json. Interactive docs: /docs."]
    return PlainTextResponse("\n".join(lines) + "\n")


@app.get("/healthz", summary="Liveness check")
def healthz() -> dict[str, bool]:
    return {"ok": True}


from rw_api import routes_status, routes_world  # noqa: E402

app.include_router(routes_status.router)
app.include_router(routes_world.router)


from rw_api import routes_receipts  # noqa: E402

app.include_router(routes_receipts.router)

app.include_router(routes_cycle.router, responses={404: not_found("cycle"), 422: INVALID})

from rw_api import routes_questions  # noqa: E402  (it imports this module)

app.include_router(routes_questions.router, responses={404: not_found("question"), 422: INVALID})

from rw_api import routes_scores  # noqa: E402

app.include_router(routes_scores.router)

from rw_api import auth, routes_me, routes_tests  # noqa: E402

app.include_router(auth.router)
app.include_router(routes_me.router)
app.include_router(routes_tests.router)


@app.exception_handler(auth.CrossOrigin)
async def cross_origin(_: Request, __: auth.CrossOrigin) -> JSONResponse:
    return auth.cross_origin_response()


if __name__ == "__main__":
    print(json.dumps(app.openapi(), indent=2))

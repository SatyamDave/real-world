"""Message tests (product/will-it-land.md, decision 0016) and the signed-in record of them
(product/track-record.md).

Routes: POST /v1/tests, POST /v1/tests/backtest, GET /v1/me/tests and
POST /v1/me/tests/{test_id}/outcome."""

import hashlib
import json
import logging
import secrets
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from rw import llm, policy, reaction, score, settings
from rw_api import app as api
from rw_api import auth

log = logging.getLogger("rw_api.tests")
router = APIRouter(tags=["account"])
SIGNED_OUT = {"model": api.Refused, "description": "No live session"}
SPEND = {
    402: {"model": api.Refused, "description": "Over the test's cost cap or today's budget"},
    422: {"model": policy.PolicyRefused, "description": "Invalid, or breaks acceptable use"},
    429: {"model": api.Refused, "description": "This address has used today's tests"},
    503: {"model": api.Refused, "description": "A spend or acceptable-use check could not run"},
}


class Seal(BaseModel):
    id: str
    sha256: str = Field(description="SHA-256 of `body`, the canonical JSON of the stored test.")
    sealed_at: str


class PostTestOut(BaseModel):
    result: reaction.PostTestResult
    seal: Seal | None = Field(description="Null when signed out: nothing is stored.")


class SealedTest(BaseModel):
    seal: Seal
    body: str = Field(description="The canonical JSON the seal hashes, byte for byte.")
    text: str
    idea: str
    icp: str
    gut: reaction.Gut | None
    intent: float
    baseline_intent: float
    outcome: reaction.Outcome | None
    metric: reaction.Metric | None = Field(description="The real number given with the mark.")
    note: str | None
    marked_at: str | None
    brier: float | None = Field(description="The engine's Brier once marked.")
    baseline_brier: float | None = Field(description="The baseline's Brier once marked.")
    gut_brier: float | None = Field(description="The gut's Brier once marked, if a gut was given.")


class BrierScore(BaseModel):
    brier: float | None = Field(description="Mean Brier; null with no marked test.")
    n: int


class TestScores(BaseModel):
    engine: BrierScore
    baseline: BrierScore
    gut: BrierScore = Field(description="Over marked tests that had a gut call.")
    engine_beats_baseline: bool | None = Field(
        description="Whether the engine's Brier is below the baseline's; null with none marked."
    )


class TestRecord(BaseModel):
    tests: list[SealedTest]
    marked: int
    hits: int = Field(description="Marked tests where the engine's side of 50% matched.")
    scores: TestScores


class Mark(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    outcome: reaction.Outcome
    metric: reaction.Metric | None = None
    note: str | None = Field(default=None, min_length=1, max_length=280)


def canonical(body: dict) -> str:
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _limits(conn: sqlite3.Connection, client: str | None) -> JSONResponse | None:
    """Refuse a signed-out caller past TEST_ANON_PER_DAY, and anyone when today's shared budget
    cannot hold one more test at its cap. A count that cannot be read refuses."""
    try:
        used = (
            0
            if client is None
            else conn.execute(
                "SELECT count(*) FROM test_clients WHERE client_sha256 = ? AND day = ?",
                (client, api._clock().date().isoformat()),
            ).fetchone()[0]
        )
        left = settings.FORK_DAILY_BUDGET_USD - llm.spent_today(conn, public=True)
    except Exception:
        log.exception("post test spend read failed")
        return api._refuse(503, "spend_unreadable", "today's spend could not be read")
    if used >= settings.TEST_ANON_PER_DAY:
        return api._refuse(
            429,
            "test_daily_limit",
            f"this address has run {settings.TEST_ANON_PER_DAY} tests today without signing in;"
            " sign in or try again after 00:00 UTC",
        )
    if not settings.TEST_MAX_COST_USD <= left:
        return api._refuse(
            402, "fork_budget_spent", "today's budget is spent; try again after 00:00 UTC"
        )
    return None


def _guard(conn: sqlite3.Connection, request: Request, text: str, signed: bool):
    """The caller's address hash (None when signed in) or a refusal."""
    client = None
    if not signed:
        client = api._client(request)
        if client is None:
            return api._refuse(503, "client_unknown", "the caller's address could not be read")
    refusal = _limits(conn, client)
    if refusal is not None:
        return refusal
    try:
        refused = policy.screen(text, conn, budget=llm.Budget(settings.SCREEN_MAX_COST_USD))
    except Exception:
        log.exception("acceptable-use screen failed")
        return api._refuse(
            503, "acceptable_use_unreadable", "the acceptable-use check could not run"
        )
    if refused is not None:
        return JSONResponse(refused.model_dump(), status_code=422)
    return client


def _session(conn: sqlite3.Connection, request: Request):
    """The signed-in row, None with no cookie, or a refusal for a bad cookie."""
    if not request.cookies.get(auth.COOKIE):
        return None
    return auth.signed_in(conn, request)


@router.post(
    "/v1/tests",
    summary="Test a message on simulated ideal customers; sealed when signed in",
    response_model=PostTestOut,
    dependencies=[Depends(auth.same_origin)],
    responses={**SPEND, 401: SIGNED_OUT, 403: auth.ACCOUNT_ERRORS[403]},
)
def test_post(body: reaction.PostTestRequest, request: Request) -> PostTestOut | JSONResponse:
    conn = api.connect()
    user = _session(conn, request)
    if isinstance(user, JSONResponse):
        return user
    client = _guard(conn, request, body.text, user is not None)
    if isinstance(client, JSONResponse):
        return client
    try:
        result = reaction.run(body, conn, llm.Budget(settings.TEST_MAX_COST_USD))
    except llm.BudgetExceeded:
        return api._refuse(
            402, "over_max_cost", f"this test would pass the ${settings.TEST_MAX_COST_USD:g} cap"
        )
    except ValueError as e:
        return api._refuse(422, "invalid_request", str(e))
    if user is None:
        with conn:
            conn.execute(
                "INSERT INTO test_clients (client_sha256, day) VALUES (?, ?)",
                (client, api._clock().date().isoformat()),
            )
        return PostTestOut(result=result, seal=None)
    test_id = f"pt_{secrets.token_hex(8)}"
    sealed_at = api._now()
    stored = canonical(
        {
            "id": test_id,
            "text": body.text,
            "idea": body.idea,
            "icp": body.icp,
            "gut": body.gut,
            "result": result.model_dump(),
            "sealed_at": sealed_at,
        }
    )
    sha = hashlib.sha256(stored.encode()).hexdigest()
    with conn:
        conn.execute(
            "INSERT INTO post_tests (id, user_id, body_json, seal_sha256, sealed_at,"
            " intent, baseline_intent, gut) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                test_id,
                user["id"],
                stored,
                sha,
                sealed_at,
                result.intent,
                result.baseline_intent,
                body.gut,
            ),
        )
    return PostTestOut(result=result, seal=Seal(id=test_id, sha256=sha, sealed_at=sealed_at))


@router.post(
    "/v1/tests/backtest",
    summary="Score the engine and the baseline on messages already shipped; stores nothing",
    response_model=reaction.BacktestResult,
    dependencies=[Depends(auth.same_origin)],
    responses={**SPEND, 401: SIGNED_OUT, 403: auth.ACCOUNT_ERRORS[403]},
)
def backtest(body: reaction.BacktestRequest, request: Request):
    conn = api.connect()
    user = _session(conn, request)
    if isinstance(user, JSONResponse):
        return user
    client = _guard(conn, request, "\n".join(m.text for m in body.messages), user is not None)
    if isinstance(client, JSONResponse):
        return client
    try:
        out = reaction.backtest(body, conn, llm.Budget(settings.TEST_MAX_COST_USD))
    except llm.BudgetExceeded:
        return api._refuse(
            402,
            "over_max_cost",
            f"this backtest would pass the ${settings.TEST_MAX_COST_USD:g} cap",
        )
    except ValueError as e:
        return api._refuse(422, "invalid_request", str(e))
    if client is not None:
        with conn:
            conn.execute(
                "INSERT INTO test_clients (client_sha256, day) VALUES (?, ?)",
                (client, api._clock().date().isoformat()),
            )
    return out


def _row(r: sqlite3.Row) -> SealedTest:
    body = json.loads(r["body_json"])
    landed = None if r["outcome"] is None else int(r["outcome"] == "landed")
    gut = None if r["gut"] is None else float(r["gut"] == "lands")
    metric = (
        None
        if r["metric_name"] is None
        else reaction.Metric(name=r["metric_name"], value=r["metric_value"], unit=r["metric_unit"])
    )
    return SealedTest(
        seal=Seal(id=r["id"], sha256=r["seal_sha256"], sealed_at=r["sealed_at"]),
        body=r["body_json"],
        text=body["text"],
        idea=body["idea"],
        icp=body["icp"],
        gut=r["gut"],
        intent=r["intent"],
        baseline_intent=r["baseline_intent"],
        outcome=r["outcome"],
        metric=metric,
        note=r["note"],
        marked_at=r["marked_at"],
        brier=None if landed is None else score.brier(r["intent"], landed),
        baseline_brier=None if landed is None else score.brier(r["baseline_intent"], landed),
        gut_brier=None if landed is None or gut is None else score.brier(gut, landed),
    )


def _score(briers: list[float | None]) -> BrierScore:
    got = [b for b in briers if b is not None]
    return BrierScore(brier=sum(got) / len(got) if got else None, n=len(got))


@router.get(
    "/v1/me/tests",
    summary="The signed-in person's sealed message tests and how engine, baseline and gut scored",
    response_model=TestRecord,
    responses={401: SIGNED_OUT, 503: auth.UNREADABLE},
)
def my_tests(request: Request) -> TestRecord | JSONResponse:
    conn = api.connect()
    user = auth.signed_in(conn, request)
    if isinstance(user, JSONResponse):
        return user
    rows = conn.execute(
        "SELECT * FROM post_tests WHERE user_id = ? ORDER BY sealed_at DESC, id", (user["id"],)
    ).fetchall()
    tests = [_row(r) for r in rows]
    marked = [t for t in tests if t.brier is not None]
    engine, baseline = _score([t.brier for t in marked]), _score([t.baseline_brier for t in marked])
    return TestRecord(
        tests=tests,
        marked=len(marked),
        hits=sum((t.intent >= 0.5) == (t.outcome == "landed") for t in marked),
        scores=TestScores(
            engine=engine,
            baseline=baseline,
            gut=_score([t.gut_brier for t in marked]),
            engine_beats_baseline=None
            if engine.brier is None or baseline.brier is None
            else engine.brier < baseline.brier,
        ),
    )


@router.post(
    "/v1/me/tests/{test_id}/outcome",
    summary="Mark a sealed message test landed or flopped, with an optional real metric, once",
    response_model=SealedTest,
    dependencies=[Depends(auth.same_origin)],
    responses={
        401: SIGNED_OUT,
        403: auth.ACCOUNT_ERRORS[403],
        404: api.not_found("post test"),
        409: {"model": api.Refused, "description": "Already marked"},
        422: api.INVALID,
    },
)
def mark(test_id: str, body: Mark, request: Request) -> SealedTest | JSONResponse:
    conn = api.connect()
    user = auth.signed_in(conn, request)
    if isinstance(user, JSONResponse):
        return user
    with conn:
        done = conn.execute(
            "UPDATE post_tests SET outcome = ?, marked_at = ?, metric_name = ?, metric_value = ?,"
            " metric_unit = ?, note = ? WHERE id = ? AND user_id = ? AND outcome IS NULL",
            (
                body.outcome,
                api._now(),
                body.metric and body.metric.name,
                body.metric and body.metric.value,
                body.metric and body.metric.unit,
                body.note,
                test_id,
                user["id"],
            ),
        )
    row = conn.execute(
        "SELECT * FROM post_tests WHERE id = ? AND user_id = ?", (test_id, user["id"])
    ).fetchone()
    if row is None:
        raise HTTPException(404, f"no post test {test_id}")
    if done.rowcount != 1:
        return api._refuse(409, "already_marked", f"post test {test_id} is already marked")
    return _row(row)

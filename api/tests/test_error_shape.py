"""Every error the API returns is one JSON shape: a string detail plus known keys."""

import time
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from rw import daily, llm, settings
from rw_api import app as api

APP = Path(api.__file__)
KEYS = {"detail", "code", "estimate", "id"}
CHIPS = {"event": {"text": "A chip shortage doubles phone prices worldwide."}, "days": 3}


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=2000)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))


@pytest.fixture
def client():
    with TestClient(api.app) as c:
        yield c


def simulate(client, body=CHIPS, key=None, **headers):
    key = key or f"k-{time.time_ns()}"
    return client.post("/v1/simulate", json=body, headers={"Idempotency-Key": key, **headers})


def reused_key(client, mp):
    key = f"k-{time.time_ns()}"
    assert simulate(client, key=key).status_code == 202
    return simulate(client, {**CHIPS, "days": 4}, key)


def running_key(client, mp):
    key = f"k-{time.time_ns()}"
    job_id = simulate(client, key=key).json()["id"]
    with api.connect() as conn:
        conn.execute("UPDATE jobs SET status = 'running' WHERE id = ?", (job_id,))
    return simulate(client, key=key)


def answer(client, mp, day, question_id=None, player="p-shape"):
    mp.setattr(api, "_clock", lambda: datetime.fromisoformat(f"{day}T12:00:00+00:00"))
    q = question_id or client.get("/v1/daily").json()["question"]["id"]
    body = {"question_id": q, "player_id": player, "probability": 0.5}
    return client.post("/v1/daily/answers", json=body)


def answered_twice(client, mp):
    answer(client, mp, "2026-10-05", player="p-twice")
    return answer(client, mp, "2026-10-05", player="p-twice")


def broken_spend(client, mp):
    def broken(_conn=None, public=False):
        raise RuntimeError("no spend table")

    mp.setattr(llm, "spent_today", broken)
    return simulate(client)


def broken_screen(client, mp):
    def broken(*_args, **_kwargs):
        raise RuntimeError("screen offline")

    mp.setattr(api.policy, "screen", broken)
    return simulate(client)


def over_cap_why(client, mp):
    mp.setattr(api, "WHY_MAX_COST_USD", 1e-12)
    agent = client.get("/v1/world").json()["countries"][0]["sample_agent_id"]
    return client.get(f"/v1/agents/{agent}/why")


def anon_limit(client, mp):
    mp.setattr(settings, "FORK_ANON_PER_DAY", 0)
    return simulate(client)


NOT_FOUND = None
ERRORS = {
    "unknown fork": (404, NOT_FOUND, lambda c, mp: c.get("/v1/simulations/job_nope")),
    "unknown fork events": (404, NOT_FOUND, lambda c, mp: c.get("/v1/simulations/job_nope/events")),
    "unknown agent": (404, NOT_FOUND, lambda c, mp: c.get("/v1/agents/nope")),
    "unknown agent why": (404, NOT_FOUND, lambda c, mp: c.get("/v1/agents/nope/why")),
    "unknown day record": (404, NOT_FOUND, lambda c, mp: c.get("/v1/receipts/1999-01-01")),
    "wrong version": (
        422,
        "unsupported_version",
        lambda c, mp: simulate(c, **{"Real-World-Version": "2026-01-01"}),
    ),
    "unknown api key": (
        401,
        "invalid_api_key",
        lambda c, mp: simulate(c, Authorization="Bearer rw_" + "0" * 32),
    ),
    "over max cost": (
        402,
        "over_max_cost",
        lambda c, mp: simulate(c, {**CHIPS, "max_cost_usd": 1e-9}),
    ),
    "budget spent": (
        402,
        "fork_budget_spent",
        lambda c, mp: mp.setattr(settings, "FORK_DAILY_BUDGET_USD", 0.0) or simulate(c),
    ),
    "agent account over its cap": (402, "why_over_cap", over_cap_why),
    "spend unreadable": (503, "spend_unreadable", broken_spend),
    "acceptable-use check could not run": (503, "acceptable_use_unreadable", broken_screen),
    "anonymous daily limit": (429, "anon_daily_limit", anon_limit),
    "acceptable-use refusal": (
        422,
        "private_person",
        lambda c, mp: simulate(c, {"event": {"text": "My landlord Dave doubles the rent."}}),
    ),
    "idempotency key reused with another body": (409, "idempotency_key_reused", reused_key),
    "idempotency key still running": (409, "idempotency_key_running", running_key),
    "answer to a wrong question": (
        422,
        "wrong_question",
        lambda c, mp: answer(c, mp, "2026-10-05", "fx-fra-strike"),
    ),
    "answer after close": (409, "answers_closed", lambda c, mp: answer(c, mp, "2026-10-28")),
    "second answer": (409, "already_answered", answered_twice),
    "invalid simulate body": (422, "invalid_request", lambda c, mp: simulate(c, {"event": {}})),
    "missing idempotency key": (
        422,
        "invalid_request",
        lambda c, mp: c.post("/v1/simulate", json=CHIPS),
    ),
    "invalid answer body": (
        422,
        "invalid_request",
        lambda c, mp: c.post("/v1/daily/answers", json={"probability": 2}),
    ),
}

FORBIDDEN = ("Traceback", "Error:", "Exception", "make daily-fixtures")


@pytest.mark.parametrize("case", ERRORS)
def test_error_body_is_a_string_detail_with_known_keys(client, monkeypatch, case):
    status, code, call = ERRORS[case]
    r = call(client, monkeypatch)
    assert r.status_code == status, r.text
    body = r.json()
    assert isinstance(body, dict) and isinstance(body.get("detail"), str), body
    assert set(body) <= KEYS, body
    assert body.get("code") == code, body
    assert not any(word in body["detail"] for word in FORBIDDEN), body
    assert body["detail"] == body["detail"].strip() and "\n" not in body["detail"], body


def test_the_contract_declares_every_error_a_route_returns():
    spec = api.app.openapi()
    for path, methods in spec["paths"].items():
        for method, op in methods.items():
            declared = set(op["responses"])
            if op.get("parameters") or "requestBody" in op:
                assert "422" in declared, (method, path)
            assert "HTTPValidationError" not in str(op["responses"]), (method, path)
            if "{" in path or path in ("/v1/world", "/v1/daily", "/v1/daily/answers"):
                assert "404" in declared, (method, path)


def test_header_parameters_use_their_canonical_names():
    spec = api.app.openapi()
    names = {
        p["name"]
        for methods in spec["paths"].values()
        for op in methods.values()
        for p in op.get("parameters", [])
        if p["in"] == "header"
    }
    assert names == {"Authorization", "Idempotency-Key", "Last-Event-ID", "Real-World-Version"}


def test_every_error_response_carries_a_detail_sentence():
    """Every JSONResponse in app.py dumps a model with a `detail` field or a dict that has one."""
    models = [api.Refused, api.policy.PolicyRefused]
    assert all("detail" in m.model_fields for m in models)
    for n, line in enumerate(APP.read_text().splitlines(), 1):
        if "JSONResponse(" in line and "import" not in line:
            assert ".model_dump(" in line or '{"detail"' in line, f"app.py:{n}: {line.strip()}"

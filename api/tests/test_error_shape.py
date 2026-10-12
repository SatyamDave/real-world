"""Every error the API returns is one JSON shape: a string detail plus known keys."""

import ast
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
        mp.delenv("ANTHROPIC_API_KEY", raising=False)
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=2000)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


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


def anon_limit(client, mp):
    mp.setattr(settings, "FORK_ANON_PER_DAY", 0)
    return simulate(client)


ERRORS = {
    "unknown simulation": (404, lambda c, mp: c.get("/v1/simulations/job_nope")),
    "unknown simulation events": (404, lambda c, mp: c.get("/v1/simulations/job_nope/events")),
    "unknown agent": (404, lambda c, mp: c.get("/v1/agents/nope")),
    "unknown agent why": (404, lambda c, mp: c.get("/v1/agents/nope/why")),
    "unknown receipt day": (404, lambda c, mp: c.get("/v1/receipts/1999-01-01")),
    "wrong version": (400, lambda c, mp: simulate(c, **{"Real-World-Version": "2026-01-01"})),
    "unknown api key": (401, lambda c, mp: simulate(c, Authorization="Bearer rw_" + "0" * 32)),
    "over max cost": (402, lambda c, mp: simulate(c, {**CHIPS, "max_cost_usd": 1e-9})),
    "budget spent": (
        402,
        lambda c, mp: mp.setattr(settings, "FORK_DAILY_BUDGET_USD", 0.0) or simulate(c),
    ),
    "spend unreadable": (503, broken_spend),
    "anonymous daily limit": (429, anon_limit),
    "acceptable-use refusal": (
        422,
        lambda c, mp: simulate(c, {"event": {"text": "My landlord Dave doubles the rent."}}),
    ),
    "idempotency key reused with another body": (422, reused_key),
    "idempotency key still running": (409, running_key),
    "answer to a wrong question": (422, lambda c, mp: answer(c, mp, "2026-10-05", "fx-fra-strike")),
    "answer after close": (409, lambda c, mp: answer(c, mp, "2026-10-28")),
    "second answer": (409, answered_twice),
    "invalid simulate body": (422, lambda c, mp: simulate(c, {"event": {}})),
    "missing idempotency key": (422, lambda c, mp: c.post("/v1/simulate", json=CHIPS)),
    "invalid answer body": (
        422,
        lambda c, mp: c.post("/v1/daily/answers", json={"probability": 2}),
    ),
}


@pytest.mark.parametrize("case", ERRORS)
def test_error_body_is_a_string_detail_with_known_keys(client, monkeypatch, case):
    status, call = ERRORS[case]
    r = call(client, monkeypatch)
    assert r.status_code == status, r.text
    body = r.json()
    assert isinstance(body, dict) and isinstance(body.get("detail"), str), body
    assert set(body) <= KEYS, body


def test_every_non_2xx_json_response_is_a_refusal_or_carries_a_detail():
    """A JSONResponse built outside _refuse must dump a model with a detail field. policy.screen
    returns a PolicyRefused, which lives outside app.py."""
    tree = ast.parse(APP.read_text())
    models = {
        n.name: {f.target.id for f in n.body if isinstance(f, ast.AnnAssign)}
        for n in ast.walk(tree)
        if isinstance(n, ast.ClassDef)
    }
    models["policy.PolicyRefused"] = set(api.policy.PolicyRefused.model_fields)
    unchecked = []
    for fn in ast.walk(tree):
        if not isinstance(fn, ast.FunctionDef) or fn.name == "_refuse":
            continue
        made = {}  # local name -> the call that last produced it, in source order
        nodes = [n for n in ast.walk(fn) if hasattr(n, "lineno")]
        for node in sorted(nodes, key=lambda n: (n.lineno, n.col_offset)):
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Call):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        made[target.id] = ast.unparse(node.value.func)
            if not (isinstance(node, ast.Call) and ast.unparse(node.func) == "JSONResponse"):
                continue
            status = next((k.value for k in node.keywords if k.arg == "status_code"), None)
            if isinstance(status, ast.Constant) and 200 <= status.value < 300:
                continue
            content = node.args[0] if node.args else None
            source = None
            if isinstance(content, ast.Call) and isinstance(content.func, ast.Attribute):
                owner = content.func.value
                source = made.get(owner.id) if isinstance(owner, ast.Name) else None
            fields = models.get("policy.PolicyRefused" if source == "policy.screen" else source)
            if fields is None or "detail" not in fields:
                unchecked.append(f"{APP.name}:{node.lineno}: {ast.unparse(node)}")
    assert not unchecked, unchecked

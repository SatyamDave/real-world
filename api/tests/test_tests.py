"""Post tests, their seals and the signed-in record (product/will-it-land.md, track-record.md)."""

import hashlib
import json
import sqlite3

import pytest
from fastapi.testclient import TestClient
from tests.test_auth import JSON, ORIGIN, at, sign_in

from rw import population
from rw_api import app as api

POST = {"text": "We cut our prices in half for students this week.", "gut": "lands"}
JSON_POST = {**JSON, "Content-Type": "application/json"}


@pytest.fixture(autouse=True)
def home(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path))
    for name in ("RW_EMAIL_API_KEY", "RW_EMAIL_FROM", "RW_ALLOWED_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    from tests.test_auth import NOW

    at(monkeypatch, NOW)
    population.write_snapshot("2026-10-01", population.sample_population(1500, 3))
    return tmp_path


@pytest.fixture
def client():
    with TestClient(api.app, base_url="http://localhost") as c:
        yield c


def run_test(client, body=POST):
    return client.post("/v1/tests", json=body, headers=JSON)


def test_a_signed_out_test_is_not_stored(client):
    r = run_test(client)
    assert r.status_code == 200, r.text
    assert r.json()["seal"] is None and 0 <= r.json()["result"]["landing_chance"] <= 1
    with api.connect() as conn:
        assert conn.execute("SELECT count(*) FROM post_tests").fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM test_clients").fetchone()[0] == 1


def test_a_signed_in_test_is_sealed_and_the_seal_recomputes(client, home):
    sign_in(client, home)
    seal = run_test(client).json()["seal"]
    record = client.get("/v1/me/tests").json()
    [t] = record["tests"]
    assert t["seal"] == seal
    assert hashlib.sha256(t["body"].encode()).hexdigest() == seal["sha256"]
    body = json.loads(t["body"])
    assert body["sealed_at"] == seal["sealed_at"] and body["gut"] == "lands"


def test_a_sealed_test_cannot_be_changed(client, home):
    sign_in(client, home)
    test_id = run_test(client).json()["seal"]["id"]
    with api.connect() as conn:
        for sql in (
            "UPDATE post_tests SET landing_chance = 0.99 WHERE id = ?",
            "UPDATE post_tests SET body_json = '{}' WHERE id = ?",
            "DELETE FROM post_tests WHERE id = ?",
        ):
            with pytest.raises(sqlite3.IntegrityError, match="sealed post test"):
                conn.execute(sql, (test_id,))


def test_an_outcome_is_marked_once(client, home):
    sign_in(client, home)
    test_id = run_test(client).json()["seal"]["id"]
    url = f"/v1/me/tests/{test_id}/outcome"
    r = client.post(url, json={"outcome": "landed"}, headers=JSON_POST)
    assert r.status_code == 200 and r.json()["outcome"] == "landed"
    again = client.post(url, json={"outcome": "flopped"}, headers=JSON_POST)
    assert again.status_code == 409 and again.json()["code"] == "already_marked"
    missing = client.post(
        "/v1/me/tests/pt_nope/outcome", json={"outcome": "landed"}, headers=JSON_POST
    )
    assert missing.status_code == 404


def test_the_record_scores_engine_and_gut_on_marked_tests_only(client, home):
    sign_in(client, home)
    ids = [run_test(client).json()["seal"]["id"] for _ in range(2)]
    run_test(client, {"text": "No gut on this one."})
    client.post(f"/v1/me/tests/{ids[0]}/outcome", json={"outcome": "flopped"}, headers=JSON_POST)
    rec = client.get("/v1/me/tests").json()
    assert len(rec["tests"]) == 3 and rec["marked"] == 1 and rec["gut_marked"] == 1
    marked = next(t for t in rec["tests"] if t["seal"]["id"] == ids[0])
    assert rec["brier"] == pytest.approx(marked["landing_chance"] ** 2)
    assert rec["gut_brier"] == pytest.approx(1.0)
    assert rec["hits"] == int(marked["landing_chance"] < 0.5)


def test_the_retrospective_check_stores_nothing(client, home):
    sign_in(client, home)
    body = {"posts": [{"text": POST["text"], "outcome": "landed"}]}
    r = client.post("/v1/tests/retrospective", json=body, headers=JSON)
    assert r.status_code == 200 and r.json()["label"] == "Retrospective: not on your record"
    with api.connect() as conn:
        assert conn.execute("SELECT count(*) FROM post_tests").fetchone()[0] == 0


def test_a_test_over_its_cap_is_refused_and_spends_nothing(client, monkeypatch):
    monkeypatch.setattr(api.settings, "TEST_MAX_COST_USD", 1e-9)
    r = run_test(client)
    assert r.status_code == 402 and r.json()["code"] in ("over_max_cost", "fork_budget_spent")
    with api.connect() as conn:
        assert (
            conn.execute("SELECT count(*) FROM llm_calls WHERE purpose = 'post_test'").fetchone()[0]
            == 0
        )


def test_signed_out_tests_stop_at_the_daily_count(client, monkeypatch):
    monkeypatch.setattr(api.settings, "TEST_ANON_PER_DAY", 1)
    assert run_test(client).status_code == 200
    r = run_test(client)
    assert r.status_code == 429 and r.json()["code"] == "test_daily_limit"


def test_a_cross_site_post_test_is_refused(client):
    r = client.post("/v1/tests", json=POST, headers={"Origin": "https://evil.example"})
    assert r.status_code == 403
    assert ORIGIN.startswith("http://localhost")

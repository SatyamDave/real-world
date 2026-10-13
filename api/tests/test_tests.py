"""Message tests, their seals, marks and the signed-in record (product/will-it-land.md,
track-record.md, decision 0016)."""

import hashlib
import json
import sqlite3

import pytest
from fastapi.testclient import TestClient
from tests.test_auth import JSON, ORIGIN, at, sign_in

from rw_api import app as api

POST = {
    "text": "We cut our prices in half for students this week.",
    "idea": "A budgeting app for freelancers",
    "icp": "Freelance designers who pay for tools monthly",
    "gut": "lands",
}
METRIC = {"name": "signup rate", "value": 3.2, "unit": "%"}
JSON_POST = {**JSON, "Content-Type": "application/json"}


@pytest.fixture(autouse=True)
def home(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path))
    for name in ("RW_EMAIL_API_KEY", "RW_EMAIL_FROM", "RW_ALLOWED_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("RW_AGENTS", "54")
    from tests.test_auth import NOW

    at(monkeypatch, NOW)
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
    result = r.json()["result"]
    assert r.json()["seal"] is None and 0 <= result["intent"] <= 1
    assert 0 <= result["baseline_intent"] <= 1 and result["agents"] == 54
    assert len(result["segments"]) == 27 and result["objections"]
    assert (
        result["disclosure"] == "AI-simulated. Simulated from your description, not real customers."
    )
    assert "coverage" not in json.dumps(result).lower()
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
    assert body["idea"] == POST["idea"] and body["icp"] == POST["icp"]
    assert t["baseline_intent"] == body["result"]["baseline_intent"]


def test_a_sealed_test_cannot_be_changed(client, home):
    sign_in(client, home)
    test_id = run_test(client).json()["seal"]["id"]
    with api.connect() as conn:
        for sql in (
            "UPDATE post_tests SET intent = 0.99 WHERE id = ?",
            "UPDATE post_tests SET baseline_intent = 0.99 WHERE id = ?",
            "UPDATE post_tests SET body_json = '{}' WHERE id = ?",
            "DELETE FROM post_tests WHERE id = ?",
        ):
            with pytest.raises(sqlite3.IntegrityError, match="sealed post test"):
                conn.execute(sql, (test_id,))


def test_a_mark_is_stored_once_with_its_metric_and_note(client, home):
    sign_in(client, home)
    test_id = run_test(client).json()["seal"]["id"]
    url = f"/v1/me/tests/{test_id}/outcome"
    body = {"outcome": "landed", "metric": METRIC, "note": "Sent to 2,000 people."}
    r = client.post(url, json=body, headers=JSON_POST)
    assert r.status_code == 200, r.text
    assert r.json()["metric"] == METRIC and r.json()["note"] == "Sent to 2,000 people."
    again = client.post(url, json={"outcome": "flopped"}, headers=JSON_POST)
    assert again.status_code == 409 and again.json()["code"] == "already_marked"
    [t] = client.get("/v1/me/tests").json()["tests"]
    assert t["outcome"] == "landed" and t["metric"] == METRIC
    missing = client.post(
        "/v1/me/tests/pt_nope/outcome", json={"outcome": "landed"}, headers=JSON_POST
    )
    assert missing.status_code == 404


def test_the_database_refuses_any_change_to_a_mark(client, home):
    sign_in(client, home)
    test_id = run_test(client).json()["seal"]["id"]
    with api.connect() as conn:
        with pytest.raises(sqlite3.IntegrityError, match="CHECK"):
            conn.execute("UPDATE post_tests SET note = 'early' WHERE id = ?", (test_id,))
        with pytest.raises(sqlite3.IntegrityError, match="CHECK"):
            conn.execute(
                "UPDATE post_tests SET outcome = 'landed', marked_at = 'now', metric_name = 'x'"
                " WHERE id = ?",
                (test_id,),
            )
    client.post(f"/v1/me/tests/{test_id}/outcome", json={"outcome": "flopped"}, headers=JSON_POST)
    with api.connect() as conn:
        for sql in (
            "UPDATE post_tests SET outcome = 'landed' WHERE id = ?",
            "UPDATE post_tests SET note = 'later' WHERE id = ?",
            "UPDATE post_tests SET metric_name = 'x', metric_value = 1, metric_unit = '%'"
            " WHERE id = ?",
        ):
            with pytest.raises(sqlite3.IntegrityError, match="sealed post test"):
                conn.execute(sql, (test_id,))


def test_a_mark_with_half_a_metric_is_refused(client, home):
    sign_in(client, home)
    test_id = run_test(client).json()["seal"]["id"]
    r = client.post(
        f"/v1/me/tests/{test_id}/outcome",
        json={"outcome": "landed", "metric": {"name": "signup rate", "value": 3}},
        headers=JSON_POST,
    )
    assert r.status_code == 422


def test_the_record_scores_engine_baseline_and_gut_on_marked_tests_only(client, home):
    sign_in(client, home)
    ids = [run_test(client).json()["seal"]["id"] for _ in range(2)]
    run_test(client, {**POST, "text": "No gut on this one.", "gut": None})
    client.post(f"/v1/me/tests/{ids[0]}/outcome", json={"outcome": "flopped"}, headers=JSON_POST)
    rec = client.get("/v1/me/tests").json()
    assert len(rec["tests"]) == 3 and rec["marked"] == 1
    marked = next(t for t in rec["tests"] if t["seal"]["id"] == ids[0])
    s = rec["scores"]
    assert s["engine"] == {"brier": pytest.approx(marked["intent"] ** 2), "n": 1}
    assert s["baseline"] == {"brier": pytest.approx(marked["baseline_intent"] ** 2), "n": 1}
    assert s["gut"] == {"brier": pytest.approx(1.0), "n": 1}
    assert s["engine_beats_baseline"] == (marked["intent"] < marked["baseline_intent"])
    assert rec["hits"] == int(marked["intent"] < 0.5)


def test_an_empty_record_has_no_scores(client, home):
    sign_in(client, home)
    s = client.get("/v1/me/tests").json()["scores"]
    assert s["engine"] == {"brier": None, "n": 0} and s["engine_beats_baseline"] is None


def test_the_backtest_stores_nothing(client, home):
    sign_in(client, home)
    body = {
        "idea": POST["idea"],
        "icp": POST["icp"],
        "messages": [
            {"text": POST["text"], "outcome": "landed", "metric": METRIC},
            {"text": "Old news.", "metric": {**METRIC, "value": 1.0}},
        ],
    }
    r = client.post("/v1/tests/backtest", json=body, headers=JSON)
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["label"] == "Backtest: not on your record" and out["marked"] == 1
    assert out["messages"][1]["outcome"] is None and out["messages"][1]["hit"] is None
    with api.connect() as conn:
        assert conn.execute("SELECT count(*) FROM post_tests").fetchone()[0] == 0


def test_a_backtest_of_more_than_ten_messages_is_refused(client):
    msgs = [{"text": f"m{i}", "outcome": "landed"} for i in range(11)]
    body = {"idea": POST["idea"], "icp": POST["icp"], "messages": msgs}
    assert client.post("/v1/tests/backtest", json=body, headers=JSON).status_code == 422


def test_a_test_without_an_idea_or_icp_is_refused(client):
    r = run_test(client, {"text": POST["text"]})
    assert r.status_code == 422 and r.json()["code"] == "invalid_request"


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

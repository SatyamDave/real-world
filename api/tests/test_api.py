import base64
import json
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from rw import daily, ledger, llm, policy, population, settings
from rw_api import app as api

ROOT = Path(__file__).resolve().parents[2]
AGENTS = 2000
CHIPS = {"event": {"text": "A chip shortage doubles phone prices worldwide."}, "days": 3}


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        mp.delenv("ANTHROPIC_API_KEY", raising=False)
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=AGENTS)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


@pytest.fixture
def client():
    with TestClient(api.app) as c:
        yield c


@pytest.fixture
def conn():
    return api.connect()


def calls(conn):
    return conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]


def key():
    return f"k-{time.time_ns()}"


def simulate(client, body, k=None, **headers):
    return client.post(
        "/v1/simulate", json=body, headers={"Idempotency-Key": k or key(), **headers}
    )


def test_simulate_runs_a_prefilled_event_to_a_simulated_result(client):
    world = client.get("/v1/world").json()
    event = world["prefilled_events"][0]
    started = time.monotonic()
    r = simulate(client, {"event": {"text": event["text"], "countries": event["countries"]}})
    assert r.status_code == 202
    created = r.json()
    assert created["status"] == "queued"
    assert created["links"] == {
        "self": f"/v1/simulations/{created['id']}",
        "events": f"/v1/simulations/{created['id']}/events",
    }
    job = client.get(created["links"]["self"]).json()
    assert time.monotonic() - started < 10
    assert job["status"] == "succeeded", job["error"]
    assert job["result"]["simulated"] is True
    assert job["result"]["world_snapshot_id"] == daily.FIXTURE_DAYS[-1]


def test_idempotency_key_replays_conflicts_and_refuses_a_new_body(client, conn):
    k = key()
    first = simulate(client, CHIPS, k)
    assert first.status_code == 202
    job_id = first.json()["id"]

    again = simulate(client, CHIPS, k)
    assert again.status_code == 202
    assert again.json()["id"] == job_id and again.json()["status"] == "succeeded"

    other = simulate(client, {**CHIPS, "days": 4}, k)
    assert other.status_code == 422

    with conn:
        conn.execute("UPDATE jobs SET status = 'running' WHERE id = ?", (job_id,))
    running = simulate(client, CHIPS, k)
    assert running.status_code == 409
    assert running.json()["id"] == job_id

    jobs = conn.execute(
        "SELECT count(*) FROM jobs WHERE id IN (SELECT job_id FROM idempotency_keys WHERE key = ?)",
        (k,),
    )
    assert jobs.fetchone()[0] == 1


def test_idempotency_key_expires_after_24_hours(client, conn):
    k = key()
    job_id = simulate(client, CHIPS, k).json()["id"]
    with conn:
        conn.execute(
            "UPDATE idempotency_keys SET created_at = '2000-01-01T00:00:00+00:00' WHERE key = ?",
            (k,),
        )
    r = simulate(client, {**CHIPS, "days": 4}, k)
    assert r.status_code == 202 and r.json()["id"] != job_id


def test_idempotency_key_and_version_headers_are_checked(client):
    no_key = client.post("/v1/simulate", json=CHIPS)
    assert no_key.status_code == 422
    assert simulate(client, CHIPS, "x" * 256).status_code == 422
    assert simulate(client, CHIPS, **{"Real-World-Version": "2026-01-01"}).status_code == 400
    ok = simulate(client, CHIPS, **{"Real-World-Version": settings.API_VERSION})
    assert ok.status_code == 202


def test_over_the_cap_is_refused_with_the_estimate_and_no_model_call(client, conn):
    before = calls(conn)
    jobs = conn.execute("SELECT count(*) FROM jobs").fetchone()[0]
    body = {"event": {"text": "A brand new event nobody has simulated."}, "max_cost_usd": 1e-9}
    r = simulate(client, body)
    assert r.status_code == 402
    assert r.json()["estimate"]["within_cap"] is False
    assert r.json()["estimate"]["estimated_cost_usd"] > 1e-9
    assert calls(conn) == before
    assert conn.execute("SELECT count(*) FROM jobs").fetchone()[0] == jobs


def jobs(conn):
    return conn.execute("SELECT count(*) FROM jobs").fetchone()[0]


def test_a_rule_refusal_returns_422_with_its_code_and_spends_nothing(client, conn):
    before, before_jobs = calls(conn), jobs(conn)
    r = simulate(client, {"event": {"text": "My landlord Dave doubles the rent."}})
    assert r.status_code == 422
    assert r.json() == {"code": "private_person", "detail": policy.DETAIL["private_person"]}
    assert calls(conn) == before
    assert jobs(conn) == before_jobs


def test_a_classifier_refusal_spends_only_the_screen_call(client, conn, monkeypatch):
    quote = "tough-on-crime framing"
    out = json.dumps({"rule": "election_persuasion", "quote": quote, "election_name": ""})

    class Stub:
        name = "stub"

        def complete(self, prompt, schema, max_tokens):
            return out, 50, 20

    monkeypatch.setattr(llm, "provider", Stub)
    last = conn.execute("SELECT COALESCE(max(id), 0) FROM llm_calls").fetchone()[0]
    before_jobs = jobs(conn)
    r = simulate(client, {"event": {"text": "Try the tough-on-crime framing on suburban mothers."}})
    assert r.status_code == 422 and r.json()["code"] == "election_persuasion"
    new = conn.execute("SELECT purpose FROM llm_calls WHERE id > ?", (last,)).fetchall()
    assert [p for (p,) in new] == ["screen"]
    assert jobs(conn) == before_jobs


def test_election_window_refuses_a_party_event(client, conn, monkeypatch):
    today = datetime.now(UTC).date()
    monkeypatch.setattr(settings, "ELECTION_WINDOW", (today, today))
    before = calls(conn)
    r = simulate(client, {"event": {"text": "Republicans win control of the House."}})
    assert r.status_code == 422 and r.json()["code"] == "election_window"
    assert calls(conn) == before


def test_a_screen_that_cannot_run_refuses_with_503(client, conn, monkeypatch):
    monkeypatch.setattr(settings, "SCREEN_MAX_COST_USD", 0.0)
    before_jobs = jobs(conn)
    r = simulate(client, {"event": {"text": "An event the screen has never seen."}})
    assert r.status_code == 503
    assert jobs(conn) == before_jobs


def test_estimate_returns_cost_and_makes_no_job(client, conn):
    jobs = conn.execute("SELECT count(*) FROM jobs").fetchone()[0]
    r = client.post("/v1/simulate/estimate", json=CHIPS)
    assert r.status_code == 200
    assert r.json()["within_cap"] is True and r.json()["model_calls"] > 0
    assert conn.execute("SELECT count(*) FROM jobs").fetchone()[0] == jobs


def test_identical_second_simulate_makes_no_model_call(client, conn):
    body = {"event": {"text": "Phone prices fall by half."}, "days": 2, "seed": 3}
    first = client.get(f"/v1/simulations/{simulate(client, body).json()['id']}").json()
    before = calls(conn)
    second = client.get(f"/v1/simulations/{simulate(client, body).json()['id']}").json()
    assert calls(conn) == before
    assert second["id"] != first["id"]
    assert second["result"] == first["result"]
    assert second["result"]["simulated"] is True


def events(client, job_id, last=None):
    headers = {} if last is None else {"Last-Event-ID": str(last)}
    with client.stream("GET", f"/v1/simulations/{job_id}/events", headers=headers) as r:
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/event-stream")
        text = "".join(r.iter_text())
    out = []
    for block in filter(None, text.strip().split("\n\n")):
        fields = dict(line.split(": ", 1) for line in block.splitlines())
        out.append((int(fields["id"]), json.loads(fields["data"])))
    return out


def test_event_stream_resumes_from_last_event_id_without_duplicates(client):
    job_id = simulate(client, {**CHIPS, "members": 2}).json()["id"]
    full = events(client, job_id)
    assert [e["type"] for _, e in full] == ["progress"] * 6 + ["succeeded"]
    ids = [i for i, _ in full]
    assert ids == sorted(set(ids))
    assert events(client, job_id, last=ids[2]) == full[3:]
    assert events(client, job_id, last=ids[-1]) == []
    assert client.get("/v1/simulations/job_missing/events").status_code == 404


def test_startup_marks_jobs_left_running_as_interrupted(conn):
    with conn:
        conn.execute(
            "INSERT INTO jobs (id, status, request_json, created_at)"
            " VALUES ('job_stale', 'running', ?, '2026-10-05T00:00:00+00:00')",
            (json.dumps(CHIPS),),
        )
    with TestClient(api.app) as c:
        job = c.get("/v1/simulations/job_stale").json()
        assert job["status"] == "failed" and job["error"] == "interrupted"
        assert events(c, "job_stale")[-1][1] == {"type": "failed", "error": "interrupted"}


def test_world_has_every_country_the_daily_question_and_prefilled_events(client):
    w = client.get("/v1/world").json()
    assert w["date"] == daily.FIXTURE_DAYS[-1]
    assert len(w["countries"]) == len(population.countries())
    assert sum(c["agent_count"] for c in w["countries"]) == AGENTS
    assert all(set(c["shares"]) == set(population.topics()) for c in w["countries"])
    assert w["daily_question_id"] == client.get("/v1/daily").json()["question"]["id"]
    assert [e["id"] for e in w["prefilled_events"]] == [
        "chip-shortage",
        "europe-heatwave",
        "ai-tutors",
    ]


def test_agent_moves_add_up_to_its_belief_change(client):
    agent_id = client.get("/v1/world").json()["countries"][0]["sample_agent_id"]
    a = client.get(f"/v1/agents/{agent_id}").json()
    snap = population.read_snapshot(daily.FIXTURE_DAYS[-1])
    i = int(np.flatnonzero(snap["agent_id"] == agent_id)[0])
    assert a["iso3"] == snap["country"][i] and a["moved"]
    for t in population.topics():
        total = sum(s["delta"] for s in a["moved"] if s["topic"] == t)
        assert total == pytest.approx(snap[f"b_{t}"][i] - snap[f"b0_{t}"][i], abs=1e-4)
    causes = {s["cause"] for s in a["moved"]}
    assert "anchor pull" in causes and causes - {"anchor pull", "nudge toward the day's polls"}
    assert client.get("/v1/agents/nobody").status_code == 404


def test_why_is_labelled_simulated_and_cached(client, conn):
    agent_id = client.get("/v1/world").json()["countries"][1]["sample_agent_id"]
    first = client.get(f"/v1/agents/{agent_id}/why").json()
    assert first["label"] == "Simulated account, not the cause" and first["simulated"] is True
    row = conn.execute("SELECT purpose FROM llm_calls ORDER BY id DESC LIMIT 1").fetchone()
    assert row[0] == "why"
    before = calls(conn)
    assert client.get(f"/v1/agents/{agent_id}/why").json() == first
    assert calls(conn) == before


def test_daily_reveal_matches_the_committed_ledger_and_refuses_a_second_answer(client, conn):
    d = client.get("/v1/daily").json()
    q = d["question"]
    assert d["reveal"] is None and q["resolution_source"].startswith("https://")
    assert client.get("/v1/daily", params={"player_id": "p-reveal"}).json()["reveal"] is None

    r = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-reveal", "probability": 0.7},
    )
    assert r.status_code == 201
    reveal = r.json()["reveal"]
    committed = {
        e["entry"]["forecaster"]: float(e["entry"]["probability"])
        for e in ledger.entries(conn, d["date"])
        if e["entry"]["kind"] == "forecast" and e["entry"]["question_id"] == q["id"]
    }
    assert reveal["sim"] == committed["sim"] and reveal["market"] == committed["market"]
    assert reveal["you"] == 0.7
    assert client.get("/v1/daily", params={"player_id": "p-reveal"}).json()["reveal"] == reveal

    again = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-reveal", "probability": 0.1},
    )
    assert again.status_code == 409
    wrong = client.post(
        "/v1/daily/answers",
        json={"question_id": "fx-fra-strike", "player_id": "p-x", "probability": 0.1},
    )
    assert wrong.status_code == 422


def test_crowd_is_everyone_but_the_caller(client, conn):
    q = client.get("/v1/daily").json()["question"]
    for player, p in (("p-crowd-a", 0.2), ("p-crowd-b", 0.9)):
        client.post(
            "/v1/daily/answers",
            json={"question_id": q["id"], "player_id": player, "probability": p},
        )
    rows = conn.execute(
        "SELECT player_id, probability FROM daily_answers WHERE question_id = ?", (q["id"],)
    ).fetchall()
    for player in ("p-crowd-a", "p-crowd-b"):
        others = [r["probability"] for r in rows if r["player_id"] != player]
        crowd = client.get("/v1/daily", params={"player_id": player}).json()["reveal"]["crowd"]
        assert crowd["count"] == len(others)
        assert crowd["mean"] == pytest.approx(sum(others) / len(others))


def test_reveal_scores_a_resolved_question(client, conn):
    q = client.get("/v1/daily").json()["question"]
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO resolutions VALUES (?, 1, ?, 'https://x.test', ?)",
            (q["id"], "2026-10-05", "2026-10-05"),
        )
    r = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-brier", "probability": 0.8},
    )
    reveal = r.json()["reveal"]
    assert reveal["outcome"] == 1 and reveal["brier"] == pytest.approx(0.04)


def test_streak_counts_consecutive_days_and_breaks_on_a_gap(client, conn):
    q = client.get("/v1/daily").json()["question"]
    with conn:
        conn.executemany(
            "INSERT INTO daily_answers (question_id, player_id, date, probability, created_at)"
            " VALUES (?, 'p-streak', ?, 0.5, ?)",
            [(f"old-{d}", d, d) for d in ("2026-10-01", "2026-10-02", "2026-10-04")],
        )
    r = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-streak", "probability": 0.4},
    )
    assert r.json()["reveal"]["streak"] == 2


def test_week_lists_seven_days_with_answers_and_scores(client, conn):
    d = client.get("/v1/daily").json()
    today, q = d["date"], d["question"]
    with conn:
        conn.execute(
            "INSERT INTO daily_answers (question_id, player_id, date, probability, created_at)"
            " VALUES ('old-week', 'p-week', '2026-10-01', 0.9, '2026-10-01')"
        )
        conn.execute(
            "INSERT OR IGNORE INTO resolutions VALUES ('old-week', 1, ?, 'https://x.test', ?)",
            (today, today),
        )
    r = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-week", "probability": 0.3},
    )
    week = r.json()["reveal"]["week"]
    assert len(week) == 7 and week[-1]["date"] == today
    assert [w["date"] for w in week] == sorted(w["date"] for w in week)
    assert week[-1]["probability"] == 0.3
    old = next(w for w in week if w["date"] == "2026-10-01")
    assert old["probability"] == 0.9 and old["brier"] == pytest.approx(0.01)
    assert sum(w["probability"] is not None for w in week) == 2


def test_receipts_verify_with_the_ledger(client, conn):
    days = client.get("/v1/receipts").json()["days"]
    assert [d["date"] for d in days] == sorted(daily.FIXTURE_DAYS, reverse=True)
    prev = ledger.GENESIS_ROOT
    scored = []
    for summary in reversed(days):
        body = client.get(f"/v1/receipts/{summary['date']}").json()
        scored += [e for e in body["entries"] if e["brier"] is not None]
        assert ledger.receipt_problems(body) == []
        assert body["day"]["prev_root"] == prev and body["record_hash"] == summary["record_hash"]
        assert summary["anchor"] == "not_anchored" and summary["anchored_at"] is None
        prev = body["day"]["root"]
    assert ledger.verify_day(conn, days[0]["date"]) == []
    assert scored and all(e["outcome"] in (0, 1) for e in scored)
    assert client.get("/v1/receipts/2020-01-01").status_code == 404


def test_receipts_show_a_day_anchored_only_when_its_token_verifies(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path))
    vector = json.loads((ROOT / "data/fixtures/receipts_test_vector.json").read_text())
    tsr = (ROOT / "engine/tests/data/freetsa_2026-10-01.tsr").read_bytes()
    ots = (ROOT / "engine/tests/data/ots_2026-10-01.bin").read_bytes()
    salts = iter(item["salt"] for item in vector["entries"])
    monkeypatch.setattr(ledger.secrets, "token_hex", lambda n: next(salts))
    monkeypatch.setattr(
        ledger, "_post", lambda url, body, h: tsr if url == settings.TSA_URL else ots
    )
    conn = api.connect()
    day = vector["day"]
    ledger.commit_day(
        conn, day["date"], [e["entry"] for e in vector["entries"]], day["protocol_hash"]
    )
    assert ledger.anchor_day(conn, day["date"]) == []
    monkeypatch.setattr(ledger.secrets, "token_hex", lambda n: n * "ab")
    entry = {**vector["entries"][0]["entry"], "date": "2026-10-02"}
    ledger.commit_day(conn, "2026-10-02", [entry], day["protocol_hash"])
    with conn:
        conn.execute(
            "INSERT INTO ledger_anchors VALUES ('2026-10-02', 'rfc3161', 'x', 'x', ?)", (tsr,)
        )

    with TestClient(api.app) as client:
        days = client.get("/v1/receipts").json()["days"]
        assert [(d["date"], d["anchor"], d["anchored_at"]) for d in days] == [
            ("2026-10-02", "not_anchored", None),
            ("2026-10-01", "anchored", "2026-10-12T17:19:19Z"),
        ]
        body = client.get("/v1/receipts/2026-10-01").json()
    assert body["anchor"] == "anchored"
    proofs = {a["kind"]: base64.b64decode(a["proof_base64"]) for a in body["anchors"]}
    assert proofs == {"rfc3161": tsr, "opentimestamps": ots}


def test_scores_summarize_resolved_committed_forecasts(client):
    s = client.get("/v1/scores").json()
    assert set(s) == {"market", "plain_llm"}
    for skill in s.values():
        assert skill["n"] > 0 and skill["claim"] == "insufficient_n"
        assert set(skill["by_tier"]) and set(skill["by_region"])


def test_healthz_and_cors(client):
    assert client.get("/healthz").json() == {"ok": True}
    r = client.options(
        "/v1/world",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"},
    )
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"

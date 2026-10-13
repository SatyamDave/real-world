import base64
import hashlib
import importlib
import json
import re
import sqlite3
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from rw import daily, ledger, llm, policy, population, settings
from rw_api import app as api
from rw_api import keys

ROOT = Path(__file__).resolve().parents[2]
AGENTS = 2000
STALE = "the server restarted before the fork finished"
CHIPS = {"event": {"text": "A chip shortage doubles phone prices worldwide."}, "days": 3}


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=AGENTS)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))


@pytest.fixture
def client():
    with TestClient(api.app) as c:
        yield c


@pytest.fixture
def conn():
    return api.connect()


@pytest.fixture
def answers_open(monkeypatch):
    """Answer tests run on the daily question's own day, whatever the date is now."""
    monkeypatch.setattr(api, "_clock", lambda: datetime(2026, 10, 5, 12, tzinfo=UTC))


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
    assert job["result"]["provider"] == "fake" and job["result"]["model"] == "fake"
    assert job["result"]["cost"]["actual_usd"] == 0
    assert job["result"]["cost"]["estimated_usd"] > 0


def test_idempotency_key_replays_conflicts_and_refuses_a_new_body(client, conn):
    k = key()
    first = simulate(client, CHIPS, k)
    assert first.status_code == 202
    job_id = first.json()["id"]

    again = simulate(client, CHIPS, k)
    assert again.status_code == 202
    assert again.json()["id"] == job_id and again.json()["status"] == "succeeded"

    other = simulate(client, {**CHIPS, "days": 4}, k)
    assert other.status_code == 409 and other.json()["code"] == "idempotency_key_reused"

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
    stale = simulate(client, CHIPS, **{"Real-World-Version": "2026-01-01"})
    assert stale.status_code == 422 and stale.json()["code"] == "unsupported_version"
    ok = simulate(client, CHIPS, **{"Real-World-Version": settings.API_VERSION})
    assert ok.status_code == 202


def test_over_the_cap_is_refused_with_the_estimate_and_no_model_call(client, conn):
    before = calls(conn)
    jobs = conn.execute("SELECT count(*) FROM jobs").fetchone()[0]
    body = {"event": {"text": "A brand new event nobody has simulated."}, "max_cost_usd": 1e-9}
    r = simulate(client, body)
    assert r.status_code == 402 and r.json()["code"] == "over_max_cost"
    assert r.json()["detail"].endswith("exceeds the $1e-09 cost cap")
    assert r.json()["estimate"]["within_cap"] is False
    assert r.json()["estimate"]["estimated_cost_usd"] > 1e-9
    assert calls(conn) == before
    assert conn.execute("SELECT count(*) FROM jobs").fetchone()[0] == jobs


def jobs(conn):
    return conn.execute("SELECT count(*) FROM jobs").fetchone()[0]


def refused_and_spent_nothing(conn, r, status, code):
    assert r.status_code == status and r.json()["code"] == code, r.json()
    return r.json()


def test_the_fork_budget_refuses_before_any_model_call(client, conn, monkeypatch):
    before, before_jobs = calls(conn), jobs(conn)
    monkeypatch.setattr(settings, "FORK_DAILY_BUDGET_USD", llm.spent_today(conn, public=True))
    body = refused_and_spent_nothing(conn, simulate(client, CHIPS), 402, "fork_budget_spent")
    assert body["detail"] == "today's fork budget is spent; try again after 00:00 UTC"
    assert body["estimate"] is None
    assert (calls(conn), jobs(conn)) == (before, before_jobs)


def test_unfinished_forks_hold_their_cap_against_the_fork_budget(client, conn, monkeypatch):
    left = settings.FORK_DAILY_BUDGET_USD - llm.spent_today(conn, public=True)
    held = json.dumps({**CHIPS, "max_cost_usd": left})
    with conn:
        conn.execute(
            "INSERT INTO jobs (id, status, request_json, created_at) VALUES"
            " ('job_held', 'running', ?, '2026-10-12T00:00:00+00:00')",
            (held,),
        )
    try:
        before = calls(conn)
        refused_and_spent_nothing(conn, simulate(client, CHIPS), 402, "fork_budget_spent")
        assert calls(conn) == before
    finally:
        with conn:
            conn.execute("DELETE FROM jobs WHERE id = 'job_held'")


def test_forks_do_not_count_against_the_nightly_budget(conn):
    with conn:
        conn.execute(
            "INSERT INTO llm_calls (at, provider, model, purpose, prompt_sha256, schema_sha256,"
            " prompt, in_tokens, out_tokens, cost_usd) VALUES (?, 'fake', 'm', 'fork_signal',"
            " 'x', 'y', 'p', 1, 1, 100.0)",
            (datetime.now(UTC).isoformat(timespec="seconds"),),
        )
    try:
        assert llm.spent_today(conn, public=True) >= 100
        assert llm.spent_today(conn) < 100
    finally:
        with conn:
            conn.execute("DELETE FROM llm_calls WHERE prompt_sha256 = 'x'")


def test_a_spend_that_cannot_be_read_refuses_with_503(client, conn, monkeypatch):
    before, before_jobs = calls(conn), jobs(conn)

    def broken(_conn=None, public=False):
        raise RuntimeError("no spend table")

    monkeypatch.setattr(llm, "spent_today", broken)
    refused_and_spent_nothing(conn, simulate(client, CHIPS), 503, "spend_unreadable")
    assert (calls(conn), jobs(conn)) == (before, before_jobs)


def test_the_anonymous_daily_cap_is_per_address(client, conn, monkeypatch):
    monkeypatch.setenv("RW_TRUSTED_PROXIES", "testclient")
    monkeypatch.setattr(settings, "FORK_ANON_PER_DAY", 1)

    def fork(ip, text):
        body = {"event": {"text": text}, "days": 1, "members": 1}
        return simulate(client, body, **{"X-Forwarded-For": f"10.0.0.1, {ip}"})

    assert fork("203.0.113.7", "Cap test one.").status_code == 202
    before, before_jobs = calls(conn), jobs(conn)
    body = refused_and_spent_nothing(
        conn, fork("203.0.113.7", "Cap test two."), 429, "anon_daily_limit"
    )
    assert body["detail"] == (
        "this address has started 1 forks today, the limit without an API key;"
        " try again after 00:00 UTC"
    )
    assert (calls(conn), jobs(conn)) == (before, before_jobs)
    assert fork("203.0.113.8", "Cap test one.").status_code == 202
    stored = conn.execute("SELECT client_sha256 FROM fork_clients").fetchall()
    assert all("203.0.113" not in r[0] for r in stored)


def test_forwarded_for_is_ignored_unless_the_peer_is_a_trusted_proxy(client, monkeypatch):
    monkeypatch.delenv("RW_TRUSTED_PROXIES", raising=False)
    monkeypatch.setattr(settings, "FORK_ANON_PER_DAY", 0)
    r = simulate(client, CHIPS, **{"X-Forwarded-For": "198.51.100.9"})
    assert r.status_code == 429


def test_a_trusted_proxy_without_forwarded_for_refuses_with_503(client, conn, monkeypatch):
    monkeypatch.setenv("RW_TRUSTED_PROXIES", "testclient")
    before, before_jobs = calls(conn), jobs(conn)
    refused_and_spent_nothing(conn, simulate(client, CHIPS), 503, "client_unknown")
    assert (calls(conn), jobs(conn)) == (before, before_jobs)


def test_anonymous_max_cost_is_clamped_to_the_default(client, conn):
    body = {"event": {"text": "Clamp test event."}, "days": 1, "members": 1, "max_cost_usd": 5.0}
    job_id = simulate(client, body).json()["id"]
    request = client.get(f"/v1/simulations/{job_id}").json()["request"]
    assert request["max_cost_usd"] == settings.FORK_MAX_COST_USD_DEFAULT


def bearer(conn, cap_usd=100.0):
    return {"Authorization": f"Bearer {keys.create(conn, 'test', cap_usd)}"}


def test_a_keyed_fork_skips_the_address_count_and_clamp_and_records_its_spend(
    client, conn, monkeypatch
):
    monkeypatch.setattr(settings, "FORK_ANON_PER_DAY", 0)
    auth = bearer(conn)
    first_call = conn.execute("SELECT COALESCE(max(id), 0) FROM llm_calls").fetchone()[0]
    body = {"event": {"text": "Keyed fork event."}, "days": 1, "members": 1, "max_cost_usd": 5.0}
    r = simulate(client, body, **auth)
    assert r.status_code == 202, r.json()
    job_id = r.json()["id"]
    assert client.get(f"/v1/simulations/{job_id}").json()["request"]["max_cost_usd"] == 5.0
    assert conn.execute("SELECT 1 FROM fork_clients WHERE job_id = ?", (job_id,)).fetchone() is None
    spent = conn.execute("SELECT spent_usd FROM key_forks WHERE job_id = ?", (job_id,)).fetchone()
    charged = conn.execute(
        "SELECT sum(cost_usd) FROM llm_calls WHERE id > ? AND purpose = 'fork_signal'",
        (first_call,),
    ).fetchone()[0]
    assert spent[0] == pytest.approx(charged) and charged > 0
    assert simulate(client, body).status_code == 429


def test_a_key_over_its_cap_or_the_fork_budget_is_refused_before_any_model_call(
    client, conn, monkeypatch
):
    before, before_jobs = calls(conn), jobs(conn)
    body = refused_and_spent_nothing(
        conn, simulate(client, CHIPS, **bearer(conn, 0.01)), 402, "key_cap_spent"
    )
    assert body["detail"] == (
        "this API key's $0.01 cap would be passed: fake model, nothing spent (estimated $0.0000"
        f" at {llm.FAKE_PRICED_AT} prices) so far, and this fork may cost up to $0.51"
    )
    monkeypatch.setattr(settings, "FORK_DAILY_BUDGET_USD", llm.spent_today(conn, public=True))
    refused_and_spent_nothing(
        conn, simulate(client, CHIPS, **bearer(conn)), 402, "fork_budget_spent"
    )
    assert (calls(conn), jobs(conn)) == (before, before_jobs)


def test_unfinished_keyed_forks_hold_their_cap_until_they_record_their_spend(client, conn):
    auth = bearer(conn, 1.0)
    key_id = conn.execute("SELECT max(id) FROM api_keys").fetchone()[0]
    held = json.dumps({**CHIPS, "max_cost_usd": 0.8})
    with conn:
        conn.execute(
            "INSERT INTO jobs (id, status, request_json, created_at) VALUES"
            " ('job_key_held', 'running', ?, '2026-10-12T00:00:00+00:00')",
            (held,),
        )
        conn.execute("INSERT INTO key_forks VALUES ('job_key_held', ?, NULL)", (key_id,))
    try:
        refused_and_spent_nothing(conn, simulate(client, CHIPS, **auth), 402, "key_cap_spent")
    finally:
        api._finish(conn, "job_key_held", error="test", spent_usd=0.1)
    assert api.key_spent(conn, key_id) == pytest.approx(0.1)
    assert simulate(client, CHIPS, **auth).status_code == 202


def test_unknown_malformed_and_revoked_keys_are_refused_with_401(client, conn):
    before_jobs = jobs(conn)
    live = keys.create(conn, "revoke me", 10.0)
    for auth in ("Bearer rw_" + "0" * 32, f"Basic {live}", live):
        r = simulate(client, CHIPS, Authorization=auth)
        refused_and_spent_nothing(conn, r, 401, "invalid_api_key")
        est = client.post("/v1/simulate/estimate", json=CHIPS, headers={"Authorization": auth})
        assert est.status_code == 401 and est.json()["code"] == "invalid_api_key"
    keys.revoke(conn, conn.execute("SELECT max(id) FROM api_keys").fetchone()[0])
    r = simulate(client, CHIPS, Authorization=f"Bearer {live}")
    assert r.json()["detail"] == "this API key is unknown or revoked"
    assert jobs(conn) == before_jobs


def test_the_keys_cli_prints_a_key_once_lists_its_spend_and_revokes_it(conn, capsys):
    keys.main(["create", "--label", "builder-a", "--cap-usd", "100"])
    key = capsys.readouterr().out.strip()
    assert re.fullmatch(r"rw_[0-9a-f]{32}", key)
    row = conn.execute("SELECT * FROM api_keys WHERE label = 'builder-a'").fetchone()
    assert row["key_sha256"] == hashlib.sha256(key.encode()).hexdigest()
    assert key not in json.dumps(dict(row))
    spent = f"fake model, nothing spent (estimated $0.0000 at {llm.FAKE_PRICED_AT} prices)"
    keys.main(["list"])
    out = capsys.readouterr().out
    assert out.startswith("id\tlabel\tcap\tspent\tstatus\n")
    assert f"{row['id']}\tbuilder-a\t$100\t{spent}\tlive" in out
    keys.main(["revoke", "--id", str(row["id"])])
    keys.main(["list"])
    assert f"{row['id']}\tbuilder-a\t$100\t{spent}\trevoked " in capsys.readouterr().out
    with pytest.raises(SystemExit) as gone:
        keys.main(["revoke", "--id", str(row["id"])])
    assert gone.value.code == 1
    for cap in ("inf", "nan", "0"):
        with pytest.raises(SystemExit) as bad:
            keys.main(["create", "--label", f"cap-{cap}", "--cap-usd", cap])
        assert bad.value.code == 1
    assert conn.execute("SELECT 1 FROM api_keys WHERE label LIKE 'cap-%'").fetchone() is None


def test_a_keyed_screen_is_charged_to_the_key_even_when_it_refuses(client, conn, monkeypatch):
    out = json.dumps(
        {"rule": "election_persuasion", "quote": "tough-on-crime framing", "election_name": ""}
    )

    class Stub:
        name = "stub"

        def complete(self, prompt, schema, max_tokens):
            return out, 50, 20

    monkeypatch.setattr(llm, "provider", Stub)
    auth = bearer(conn, 1.0)
    key_id = conn.execute("SELECT max(id) FROM api_keys").fetchone()[0]
    last = conn.execute("SELECT COALESCE(max(id), 0) FROM llm_calls").fetchone()[0]
    body = {"event": {"text": "Test the tough-on-crime framing on retired teachers."}}
    r = simulate(client, body, **auth)
    assert r.status_code == 422 and r.json()["code"] == "election_persuasion"
    (cost,) = conn.execute("SELECT cost_usd FROM llm_calls WHERE id > ?", (last,)).fetchone()
    assert cost > 0 and api.key_spent(conn, key_id) == pytest.approx(cost)


def test_a_key_lookup_or_key_spend_that_cannot_be_read_refuses_with_503(client, conn, monkeypatch):
    auth = bearer(conn)
    before, before_jobs = calls(conn), jobs(conn)
    connect = api.connect

    def no_keys_table():
        c = connect()
        c.set_authorizer(
            lambda action, table, *_: (
                sqlite3.SQLITE_DENY if table == "api_keys" else sqlite3.SQLITE_OK
            )
        )
        return c

    monkeypatch.setattr(api, "connect", no_keys_table)
    body = refused_and_spent_nothing(conn, simulate(client, CHIPS, **auth), 503, "spend_unreadable")
    assert body["detail"] == "the API key could not be checked"
    est = client.post("/v1/simulate/estimate", json=CHIPS, headers=auth)
    assert est.status_code == 503 and est.json()["code"] == "spend_unreadable"
    monkeypatch.setattr(api, "connect", connect)

    def broken(conn, key):
        raise RuntimeError("no key_forks table")

    monkeypatch.setattr(api, "key_spent", broken)
    refused_and_spent_nothing(conn, simulate(client, CHIPS, **auth), 503, "spend_unreadable")
    assert (calls(conn), jobs(conn)) == (before, before_jobs)


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
    assert r.status_code == 503 and r.json()["code"] == "acceptable_use_unreadable"
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
        assert job["status"] == "failed" and job["error"] == STALE
        assert events(c, "job_stale")[-1][1] == {"type": "failed", "error": STALE}


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

    first = population.read_snapshot(daily.FIXTURE_DAYS[-2])
    j = int(np.flatnonzero(first["agent_id"] == agent_id)[0])
    for t in population.topics():
        old = first[f"b_{t}"][j]
        want = settings.ANCHOR_PULL * (first[f"b0_{t}"][j] + first[f"c_{t}"][j] - old)
        got = [
            s["delta"]
            for s in a["moved"]
            if s["topic"] == t
            and s["cause"] == "anchor pull"
            and s["date"] == daily.FIXTURE_DAYS[-1]
        ]
        assert sum(got) == pytest.approx(want, abs=1e-6)


def test_why_is_labelled_simulated_and_cached(client, conn):
    agent_id = client.get("/v1/world").json()["countries"][1]["sample_agent_id"]
    first = client.get(f"/v1/agents/{agent_id}/why").json()
    assert first["label"] == "Simulated account, not the cause" and first["simulated"] is True
    assert first["provider"] == "fake"
    row = conn.execute("SELECT purpose FROM llm_calls ORDER BY id DESC LIMIT 1").fetchone()
    assert row[0] == "why"
    before = calls(conn)
    assert client.get(f"/v1/agents/{agent_id}/why").json() == first
    assert calls(conn) == before


def test_daily_reveal_matches_the_committed_ledger_and_refuses_a_second_answer(
    client, conn, answers_open
):
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
    assert again.status_code == 409 and again.json()["code"] == "already_answered"
    wrong = client.post(
        "/v1/daily/answers",
        json={"question_id": "fx-fra-strike", "player_id": "p-x", "probability": 0.1},
    )
    assert wrong.status_code == 422 and wrong.json()["code"] == "wrong_question"


def freeze(monkeypatch, day):
    monkeypatch.setattr(api, "_clock", lambda: datetime.fromisoformat(f"{day}T12:00:00+00:00"))


def test_the_daily_question_is_its_own_day_question_while_open(client, monkeypatch):
    freeze(monkeypatch, "2026-10-10")
    d = client.get("/v1/daily").json()
    assert d["date"] == "2026-10-05" and d["question"]["id"] == "fx-bra-mex-retail"


def test_after_its_close_the_daily_question_is_the_next_open_one_the_day_forecast(
    client, conn, monkeypatch
):
    freeze(monkeypatch, "2026-10-12")
    fixtures = api.forecast.load_questions()
    # Open and closing first, but the day never forecast it, so it has no committed sim.
    unforecast = {**fixtures[0], "id": "fx-not-forecast", "daily_on": None, "closes": "2026-10-13"}
    monkeypatch.setattr(api.forecast, "load_questions", lambda: [*fixtures, unforecast])
    d = client.get("/v1/daily").json()
    assert (
        d["question"]["id"] == "fx-ind-idn-fuel-price" and d["question"]["closes_at"] > "2026-10-12"
    )
    assert client.get("/v1/world").json()["daily_question_id"] == "fx-ind-idn-fuel-price"

    r = client.post(
        "/v1/daily/answers",
        json={"question_id": "fx-ind-idn-fuel-price", "player_id": "p-next", "probability": 0.6},
    )
    assert r.status_code == 201
    committed = {
        e["entry"]["forecaster"]: float(e["entry"]["probability"])
        for e in ledger.entries(conn, d["date"])
        if e["entry"]["kind"] == "forecast" and e["entry"]["question_id"] == "fx-ind-idn-fuel-price"
    }
    reveal = r.json()["reveal"]
    assert reveal["sim"] == committed["sim"] and reveal["market"] == committed["market"]
    assert reveal["streak"] >= 1 and reveal["week"][-1]["probability"] == 0.6


def test_the_fallback_is_never_a_later_day_s_own_question(client, conn, monkeypatch):
    # With the ledger through 10-04, fx-bra-mex-retail is open and closes soonest, but it is
    # 10-05's own question; an answer to it now would be filed under 10-04.
    monkeypatch.setattr(api, "_today", lambda conn: "2026-10-04")
    freeze(monkeypatch, "2026-10-04")
    q = client.get("/v1/daily").json()["question"]
    assert q["id"] == "fx-ind-idn-fuel-price"
    r = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-fallback-day", "probability": 0.4},
    )
    assert r.status_code == 201 and r.json()["date"] == "2026-10-04"
    assert r.json()["reveal"]["sim"] is not None


def test_week_shows_today_s_question_when_a_day_has_several_answers(client, conn, monkeypatch):
    freeze(monkeypatch, "2026-10-12")
    d = client.get("/v1/daily").json()
    r = client.post(
        "/v1/daily/answers",
        json={"question_id": d["question"]["id"], "player_id": "p-two", "probability": 0.3},
    )
    assert r.status_code == 201
    with conn:
        conn.execute(
            "INSERT INTO daily_answers (question_id, player_id, date, probability, created_at)"
            " VALUES ('fx-other', 'p-two', ?, 0.9, '2026-10-12T13:00:00+00:00')",
            (d["date"],),
        )
    week = client.get("/v1/daily", params={"player_id": "p-two"}).json()["reveal"]["week"]
    assert week[-1]["probability"] == 0.3


def test_when_every_question_has_closed_answers_are_refused_and_not_written(
    client, conn, monkeypatch
):
    freeze(monkeypatch, "2026-10-28")
    q = client.get("/v1/daily").json()["question"]
    assert q["id"] == "fx-bra-mex-retail"
    r = client.post(
        "/v1/daily/answers",
        json={"question_id": q["id"], "player_id": "p-late", "probability": 0.7},
    )
    assert r.status_code == 409 and r.json()["code"] == "answers_closed"
    row = conn.execute("SELECT 1 FROM daily_answers WHERE player_id = 'p-late'").fetchone()
    assert row is None


def test_crowd_is_everyone_but_the_caller(client, conn, answers_open):
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


def test_reveal_scores_a_resolved_question(client, conn, answers_open):
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


def test_streak_counts_consecutive_days_and_breaks_on_a_gap(client, conn, answers_open):
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


def test_week_lists_seven_days_with_answers_and_scores(client, conn, answers_open):
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
    monkeypatch.setattr(ledger, "FIXTURE_PREFIX", "never-")  # the recorded vector uses fx- ids
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


def test_receipt_entries_carry_their_question_and_llms_txt_lists_every_route(client):
    day = client.get("/v1/receipts").json()["days"][0]["date"]
    entries = client.get(f"/v1/receipts/{day}").json()["entries"]
    forecasts = [e for e in entries if e["entry"]["kind"] == "forecast"]
    assert forecasts and all(
        e["question"]["text"]
        and e["question"]["resolution_source"]
        and e["question"]["resolves_by"]
        for e in forecasts
    )
    assert all(e["question"] is None for e in entries if e["entry"]["kind"] != "forecast")
    text = client.get("/llms.txt").text
    assert text.startswith("# Real World API") and "- POST /v1/simulate: " in text
    for path in client.get("/openapi.json").json()["paths"]:
        assert f" {path}: " in text


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


def test_allowed_origins_add_to_localhost_and_a_malformed_one_fails_startup(monkeypatch):
    preflight = {"Access-Control-Request-Method": "GET"}
    try:
        monkeypatch.setenv("RW_ALLOWED_ORIGINS", "https://realworld.example")
        monkeypatch.setenv("RW_EMAIL_API_KEY", "re_test")
        monkeypatch.setenv("RW_EMAIL_FROM", "sign-in@realworld.example")
        with TestClient(importlib.reload(api).app) as c:
            for origin in ("https://realworld.example", "http://localhost:5173"):
                r = c.options("/v1/world", headers={"Origin": origin, **preflight})
                assert r.headers["access-control-allow-origin"] == origin
            r = c.options("/v1/world", headers={"Origin": "https://evil.example", **preflight})
            assert "access-control-allow-origin" not in r.headers
        monkeypatch.setenv("RW_ALLOWED_ORIGINS", "realworld.example")
        with pytest.raises(ValueError, match="not origins"):
            importlib.reload(api)
    finally:
        monkeypatch.delenv("RW_ALLOWED_ORIGINS")
        importlib.reload(api)


def test_a_receipt_leaf_proves_inclusion_up_to_the_days_root(client):
    day = client.get("/v1/receipts").json()["days"][0]["date"]
    entries = client.get(f"/v1/receipts/{day}").json()["entries"]
    leaves = [e["leaf_hash"] for e in entries]
    for e in entries:
        r = client.get(f"/v1/receipts/{day}/leaves/{e['leaf_hash']}")
        assert r.status_code == 200
        body = r.json()
        assert body["leaf_hash"] == e["leaf_hash"] and body["salt"] == e["salt"]
        assert body["entry"] == e["entry"] and body["question"] == e["question"]
        assert body["root"] == body["day"]["root"]
        assert body["proof"] == ledger.inclusion_proof(leaves, e["leaf_hash"])
        assert ledger.verify_inclusion(body["leaf_hash"], body["proof"], body["root"])
        assert body["anchor"] == "not_anchored" and body["anchored_at"] is None
    assert client.get(f"/v1/receipts/{day}/leaves/{'0' * 64}").status_code == 404
    assert client.get(f"/v1/receipts/2020-01-01/leaves/{leaves[0]}").status_code == 404


def test_the_ai_call_is_sealed_but_hidden_before_the_answer(client, conn, answers_open):
    d = client.get("/v1/daily").json()
    leaf = api._sim_leaf(conn, d["date"], d["question"]["id"])
    assert leaf is not None
    assert d["sealed"] == {"leaf_hash": leaf["leaf_hash"], "date": d["date"]}
    assert d["reveal"] is None and "probability" not in json.dumps(d["sealed"])


def test_the_record_scores_player_and_ai_on_the_same_questions(client, conn, answers_open):
    resolved = conn.execute("SELECT question_id, outcome FROM resolutions").fetchall()
    day, qid, outcome = next(
        (day, q, o)
        for q, o in resolved
        for day in daily.FIXTURE_DAYS
        if api._sim_leaf(conn, day, q) is not None
    )
    with conn:
        conn.execute(
            "INSERT INTO daily_answers (question_id, player_id, date, probability, created_at)"
            " VALUES (?, 'p-vs-ai', ?, 0.9, ?)",
            (qid, day, api._now()),
        )
    leaf = api._sim_leaf(conn, day, qid)
    assert leaf is not None
    ai = float(leaf["entry"]["probability"])
    record = api._vs_ai(conn, "p-vs-ai")
    assert record.n == 1 and record.you is not None and record.ai is not None
    assert record.you == pytest.approx((0.9 - outcome) ** 2)
    assert record.ai == pytest.approx((ai - outcome) ** 2)
    assert record.wins == int(record.you < record.ai)

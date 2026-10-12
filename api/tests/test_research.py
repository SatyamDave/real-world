import re

import pytest
from fastapi.testclient import TestClient

from rw import experiments
from rw_api import app as api


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    with TestClient(api.app) as c:
        yield c


def test_every_registered_experiment_hash_matches(client):
    body = client.get("/v1/research").json()
    assert [e["id"] for e in body["experiments"]] == sorted(experiments.registry())
    for e in body["experiments"]:
        assert e["hash_matches"] and e["prereg_sha256"] == e["registry_sha256"]
        assert re.fullmatch(r"[0-9a-f]{64}", e["prereg_sha256"])
        assert e["hypothesis"] and e["primary_metric"] and e["kill_criterion"]
    assert body["commit"] == experiments.git_commit()


def test_e003_and_e006_carry_results_the_others_none(client):
    by_id = {e["id"]: e for e in client.get("/v1/research").json()["experiments"]}
    for exp_id in ("E003", "E006"):
        (r,) = by_id[exp_id]["results"]
        assert r["primary"]["n"] == 50 and r["primary"]["low"] <= r["primary"]["value"]
        assert r["outcome"] == "supported" and r["model"] == "none"
        assert r["path"] == f"experiments/{exp_id}/results/2026-10-12-none/RESULTS.md"
    assert {e["id"] for e in by_id.values() if e["results"]} == {"E003", "E006"}


def test_a_changed_prereg_reports_a_hash_that_differs(client, monkeypatch):
    monkeypatch.setattr(experiments, "prereg_sha256", lambda exp_id: "0" * 64)
    body = client.get("/v1/research").json()
    assert not any(e["hash_matches"] for e in body["experiments"])


def test_eight_papers_each_with_a_folder(client):
    papers = client.get("/v1/research").json()["papers"]
    assert len(papers) == 8
    for p in papers:
        folder = experiments.REPO / "papers" / p["slug"]
        assert (folder / "paper.tex").exists() and (folder / "STATUS.md").exists()
        assert p["claim"] and p["stage"] and p["venue"] and p["pending"]
        assert p["tex_url"].endswith(f"papers/{p['slug']}/paper.tex")
        assert p["pdf"]["how"] == f"cd papers/{p['slug']} && tectonic paper.tex"

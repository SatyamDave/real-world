import pytest
from fastapi.testclient import TestClient

from rw import daily, population, settings
from rw_api import app as api


@pytest.fixture(scope="module")
def home(tmp_path_factory):
    path = tmp_path_factory.mktemp("rw") / "var"
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("RW_HOME", str(path))
        for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
            mp.delenv(var, raising=False)
        for day in daily.FIXTURE_DAYS:
            daily.run(day, world_agents=2000)
    return path


@pytest.fixture(autouse=True)
def isolated(home, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(home))
    for var in ("TYPESAFE_API_KEY", "OPENROUTER_API_KEY", "RW_TEXT_BASE_URL"):
        monkeypatch.delenv(var, raising=False)


@pytest.fixture
def client():
    with TestClient(api.app) as c:
        yield c


def test_population_is_the_latest_snapshot_with_every_count_adding_up(client):
    p = client.get("/v1/world/population").json()
    assert p["date"] == population.latest_snapshot_date()
    assert p["agents"] == sum(c["agent_count"] for c in p["countries"])
    assert p["segments"] == sum(len(c["segments"]) for c in p["countries"])
    assert len(p["countries"]) == len(population.countries())
    for c in p["countries"]:
        assert c["agent_count"] == sum(s["agent_count"] for s in c["segments"])
        assert c["rubric"]["score"] == sum(c["rubric"][k] for k in population.RUBRIC)
    assert p["tier_floors"] == dict(population.TIER_FLOORS)
    used = p["settings_used"]
    assert used["spread_band"] == list(settings.SPREAD_BAND)
    assert used["stubbornness_beta"] == list(population.STUBBORNNESS_BETA)
    assert used["offset_sd_logit"] == population.OFFSET_SD_LOGIT


def test_each_topic_pairs_the_published_marginal_with_the_simulated_spread(client):
    p = client.get("/v1/world/population").json()
    marginals = {
        (r["iso3"], r["topic"]): float(r["mean_share"])
        for r in population._read(population.SAMPLE / "attitudes.csv")
    }
    topics = [t for c in p["countries"] for t in c["topics"]]
    assert len(topics) == len(p["countries"]) * len(population.topics())
    for c in p["countries"]:
        for t in c["topics"]:
            assert t["calibrated_share"] == marginals[(c["iso3"], t["topic"])]
            assert 0 <= t["p10"] <= t["p50"] <= t["p90"] <= 1
            assert t["ratio"] is not None
            assert t["in_band"] == (
                settings.SPREAD_BAND[0] <= t["ratio"] <= settings.SPREAD_BAND[1]
            )
    assert p["sources"][0]["source_id"] == population.SOURCE_ID


def test_audit_fields_are_null_before_learn_has_run(client, tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path))
    population.write_snapshot("2026-10-05", population.sample_population(300, 1))
    p = client.get("/v1/world/population").json()
    topics = [t for c in p["countries"] for t in c["topics"]]
    assert all(t["ratio"] is None and t["in_band"] is None for t in topics)
    assert not any(c["experimental"] for c in p["countries"])


def test_no_snapshot_is_a_404_in_the_one_error_shape(client, tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path))
    r = client.get("/v1/world/population")
    assert r.status_code == 404
    assert isinstance(r.json()["detail"], str)

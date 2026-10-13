import csv
import time
from collections import defaultdict

import numpy as np
import pytest

from rw import population, sources

N = 10000
SEED = 7


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


@pytest.fixture(scope="module")
def world():
    return population.sample_population(N, SEED)


def read(name):
    with (population.SAMPLE / name).open(newline="") as f:
        return list(csv.DictReader(f))


def test_sample_files_cover_the_vocabularies():
    isos = {r["iso3"] for r in population.countries()}
    tps = set(population.topics())
    totals = defaultdict(float)
    for r in read("demographics.csv"):
        totals[r["iso3"]] += float(r["share"])
    assert set(totals) == isos
    assert all(abs(t - 1) < 1e-6 for t in totals.values())
    pairs = [(r["iso3"], r["topic"]) for r in read("attitudes.csv")]
    assert sorted(pairs) == sorted((i, t) for i in isos for t in tps)
    assert all(0 < float(r["mean_share"]) < 1 for r in read("attitudes.csv"))
    for r in read("segment_effects.csv"):
        assert r["trait"] in {"age_band", "education"} and r["topic"] in tps
        assert abs(float(r["delta_logit"])) <= 0.3


def test_same_seed_gives_identical_agents(world):
    again = population.sample_population(N, SEED)
    assert list(again) == list(world)
    for name in world:
        np.testing.assert_array_equal(again[name], world[name])
    other = population.sample_population(N, SEED + 1)
    assert not np.array_equal(other["s"], world["s"])


def test_columns_follow_decision_0001(world):
    tps = population.topics()
    expected = ["agent_id", "country", "age_band", "sex", "education", "urban", "segment", "tier"]
    expected += ["lat", "lng", "s", "offset"] + [f"b_{t}" for t in tps] + [f"b0_{t}" for t in tps]
    assert list(world) == expected
    assert all(len(v) == N for v in world.values())
    assert len(set(world["agent_id"])) == N and world["agent_id"][0] == "a0000"
    assert set(world["age_band"]) <= {"18-34", "35-54", "55+"}
    assert set(world["education"]) <= {"low", "mid", "high"}
    assert set(world["sex"]) <= {"f", "m"} and set(world["urban"]) <= {0, 1}
    assert world["segment"][0] == population.segment_key(
        {k: world[k][0] for k in ("country", "age_band", "education")}
    )
    assert ((world["s"] > 0) & (world["s"] < 1)).all()
    for t in tps:
        np.testing.assert_array_equal(world[f"b_{t}"], world[f"b0_{t}"])


def test_every_country_present_within_two_points_of_allocation(world):
    rows = population.countries()
    weights = population.country_weights(rows)
    assert abs(weights.sum() - 1) < 1e-12
    assert (weights >= population.COUNTRY_FLOOR_SHARE - 1e-12).all()
    pop = np.array([float(r["population_millions"]) for r in rows])
    unfloored = weights > population.COUNTRY_FLOOR_SHARE
    ratio = weights[unfloored] / pop[unfloored]
    np.testing.assert_allclose(ratio, ratio[0])
    for row, w in zip(rows, weights, strict=True):
        share = (world["country"] == row["iso3"]).mean()
        assert share > 0
        assert abs(share - w) < 0.02


def test_lat_lng_within_two_degrees_of_centroid(world):
    for row in population.countries():
        mask = world["country"] == row["iso3"]
        assert (np.abs(world["lat"][mask] - float(row["lat"])) <= 2).all()
        assert (np.abs(world["lng"][mask] - float(row["lng"])) <= 2).all()


def test_b0_spread_matches_survey_sd_plus_effect_spread(world):
    tps = population.topics()
    effects = population.segment_effects(world, tps)
    for r in read("attitudes.csv"):
        mask = world["country"] == r["iso3"]
        j = tps.index(r["topic"])
        expected = np.sqrt(float(r["survey_sd_logit"]) ** 2 + effects[mask, j].var())
        sim = world[f"b0_{r['topic']}"][mask].std()
        assert abs(sim / expected - 1) < 0.2, (r["iso3"], r["topic"], sim, expected)


def test_tiers_match_hand_computed_table(world):
    # USA 25+25+15+20+15=100, BRA 12+25+0+20+15=72, IND 0+12+5+20+5=42, CHN 12+5+0+0+5=22.
    expected = {"USA": "A", "BRA": "B", "IND": "C", "CHN": "D"}
    rows = {r["iso3"]: r for r in population.countries()}
    for iso, tier in expected.items():
        assert population.coverage_tier(rows[iso]) == tier
        assert set(world["tier"][world["country"] == iso]) == {tier}
    edge = dict.fromkeys(population.RUBRIC, 0)
    for score, tier in [(75, "A"), (74, "B"), (50, "B"), (49, "C"), (25, "C"), (24, "D")]:
        assert population.coverage_tier({**edge, "population": score}) == tier


def test_snapshot_round_trips_byte_identically(world):
    sha = population.write_snapshot("2026-10-01", world)
    first = population.snapshot_path("2026-10-01").read_bytes()
    back = population.read_snapshot("2026-10-01")
    assert list(back) == list(world)
    for name in world:
        np.testing.assert_array_equal(back[name], world[name])
        assert back[name].dtype.kind == world[name].dtype.kind
    assert population.write_snapshot("2026-10-02", back) == sha
    assert population.snapshot_path("2026-10-02").read_bytes() == first


def test_latest_snapshot_date(world):
    assert population.latest_snapshot_date() is None
    population.write_snapshot("2026-10-02", world)
    population.write_snapshot("2026-10-01", world)
    assert population.latest_snapshot_date() == "2026-10-02"


def test_refuses_when_sample_source_is_not_cleared(monkeypatch):
    def refuse(source_id):
        raise sources.SourceNotCleared(source_id)

    monkeypatch.setattr(sources, "require", refuse)
    with pytest.raises(sources.SourceNotCleared):
        population.sample_population(100, SEED)


def test_ten_thousand_agent_world_samples_and_saves_in_under_five_seconds():
    start = time.perf_counter()
    population.write_snapshot("2026-10-01", population.sample_population(N, SEED))
    assert time.perf_counter() - start < 5

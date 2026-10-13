import csv

import numpy as np
import pytest

from rw import db, llm, news, sources
from rw.sources import SourceNotCleared

DAYS = [f"2026-10-0{d}" for d in range(1, 6)]
FIXTURES = news.DATA / "fixtures"


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


def read(path):
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def calls(conn):
    return conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]


def test_fixture_files_parse_and_use_the_vocabularies():
    countries = set(news.country_names())
    topics = set(news.topics())
    for day in DAYS:
        rows = read(FIXTURES / "news" / f"{day}.csv")
        assert list(rows[0]) == ["date", "iso3", "theme", "tone", "num_sources", "title", "url"]
        assert {r["iso3"] for r in rows} == countries
        for r in rows:
            assert r["date"] == day and r["title"].startswith("FIXTURE:")
            assert -10 <= float(r["tone"]) <= 10 and int(r["num_sources"]) > 0
    for day in ["2026-10-02", "2026-10-04"]:
        for r in read(FIXTURES / "polls" / f"{day}.csv"):
            assert r["date"] == day and r["iso3"] in countries and r["topic"] in topics
            assert 0 <= float(r["share"]) <= 1 and int(r["n"]) > 0
            sources.require(r["source_id"])
    reach = read(news.DATA / "sample" / "channel_reach.csv")
    assert {r["iso3"] for r in reach} == countries
    assert {r["age_band"] for r in reach} == {"18-34", "35-54", "55+"}
    assert all(0 <= float(r["reach"]) <= 1 for r in reach)


def test_ingest_writes_one_row_per_kept_cluster_per_topic_and_is_idempotent():
    conn = db.connect()
    budget = llm.Budget(1.0)
    day = "2026-10-02"
    news.ingest_day(conn, day, budget)

    kept = news.clusters(read(FIXTURES / "news" / f"{day}.csv"))
    per_country = {c["iso3"] for c in kept}
    assert all(sum(c["iso3"] == iso3 for c in kept) <= 3 for iso3 in per_country)
    signals = conn.execute("SELECT * FROM signals WHERE date = ?", (day,)).fetchall()
    assert len(signals) == len(kept) * len(news.topics())
    assert calls(conn) == len(kept)
    assert {(r["iso3"], r["title"]) for r in signals} == {(c["iso3"], c["title"]) for c in kept}
    polls = read(FIXTURES / "polls" / f"{day}.csv")
    assert conn.execute("SELECT count(*) FROM observations").fetchone()[0] == len(polls)

    spent = budget.spent_usd
    total = conn.total_changes
    news.ingest_day(conn, day, budget)
    assert calls(conn) == len(kept)
    assert conn.total_changes == total
    assert budget.spent_usd == spent


def test_clusters_keep_the_most_sourced_themes_per_country():
    rows = [
        {"iso3": "USA", "theme": t, "num_sources": str(n), "title": f"FIXTURE: {t} {n}"}
        for t, n in [("A", 5), ("A", 6), ("B", 10), ("C", 9), ("D", 1), ("D", 1)]
    ]
    kept = news.clusters(rows)
    assert [(c["theme"], c["num_sources"]) for c in kept] == [("A", 11), ("B", 10), ("C", 9)]
    assert kept[0]["title"] == "FIXTURE: A 6"


def test_all_five_fixture_days_ingest_and_every_signal_names_its_headline():
    conn = db.connect()
    for day in DAYS:
        news.ingest_day(conn, day, llm.Budget(1.0))
    dates = {r[0] for r in conn.execute("SELECT DISTINCT date FROM signals")}
    assert dates == set(DAYS)
    titles = conn.execute("SELECT title FROM signals").fetchall()
    assert titles and all(r[0].startswith("FIXTURE: ") for r in titles)


@pytest.mark.parametrize("attr", ["NEWS_SOURCE", "POLLS_SOURCE"])
def test_a_source_marked_no_is_refused_before_any_write(monkeypatch, attr):
    monkeypatch.setattr(news, attr, "gadm")
    conn = db.connect()
    with pytest.raises(SourceNotCleared):
        news.ingest_day(conn, "2026-10-02", llm.Budget(1.0))
    assert calls(conn) == 0
    assert conn.execute("SELECT count(*) FROM observations").fetchone()[0] == 0


def test_a_poll_from_a_refused_source_is_refused(monkeypatch, tmp_path):
    data = tmp_path / "data"
    (data / "fixtures" / "news").mkdir(parents=True)
    (data / "fixtures" / "polls").mkdir(parents=True)
    day = "2026-10-02"
    (data / "fixtures" / "news" / f"{day}.csv").write_text(
        (FIXTURES / "news" / f"{day}.csv").read_text()
    )
    (data / "fixtures" / "polls" / f"{day}.csv").write_text(
        "date,iso3,topic,share,n,source_id\n2026-10-02,USA,inflation_worry,0.6,1000,gadm\n"
    )
    monkeypatch.setattr(news, "DATA", data)
    conn = db.connect()
    with pytest.raises(SourceNotCleared):
        news.ingest_day(conn, day, llm.Budget(1.0))
    assert conn.execute("SELECT count(*) FROM observations").fetchone()[0] == 0


def test_signal_maps_score_levels_onto_minus_one_to_one(monkeypatch):
    def answers(*a, **k):
        # Levels indexed from 1, as Jev may number them: the mapping reads the order only.
        out = {
            t: {"type": "score", "probabilities": {"1": 1.0, "2": 0, "3": 0, "4": 0, "5": 0}}
            for t in news.topics()
        }
        out["salience"] = {"type": "noul", "noul": 0.25}
        return out

    monkeypatch.setattr(llm, "decide", answers)
    signal = news.extract_signal("FIXTURE: anything", None, llm.Budget(1.0))
    assert set(signal) == set(news.topics()) | {"salience"}
    assert all(signal[t] == -1.0 for t in news.topics())
    assert signal["salience"] == 0.25


def test_extract_signal_uses_the_signal_purpose_and_audience():
    conn = db.connect()
    budget = llm.Budget(1.0)
    out = news.extract_signal("FIXTURE: fuel up", "Women 55+ in Brazil", budget, conn=conn)
    assert all(-1 <= out[t] <= 1 for t in news.topics()) and 0 <= out["salience"] <= 1
    row = conn.execute("SELECT purpose, prompt FROM llm_calls").fetchone()
    assert row["purpose"] == "signal" and "Women 55+ in Brazil" in row["prompt"]


def test_exposure_probability_is_monotone_and_decays():
    low = news.reach()[("IND", "18-34")]
    high = news.reach()[("USA", "55+")]
    assert low < high
    p = news.exposure_probability(["18-34", "55+"], ["IND", "USA"], 0.5, 0)
    assert p[0] < p[1]
    sal = news.exposure_probability("55+", "USA", np.array([0.0, 0.2, 0.5, 1.0]), 0)
    assert np.all(np.diff(sal) > 0) and sal[0] == 0
    days = news.exposure_probability("55+", "USA", 0.8, np.arange(6))
    assert np.all(np.diff(days) < 0)
    assert days[1] == pytest.approx(days[0] / 2)


def test_exposure_mask_matches_its_probability():
    n = 20000
    rng = np.random.default_rng(0)
    mask = news.exposure(np.full(n, "35-54"), np.full(n, "DEU"), 0.6, 1.0, rng)
    assert mask.dtype == bool and mask.shape == (n,)
    p = news.exposure_probability("35-54", "DEU", 0.6, 1.0)
    assert mask.mean() == pytest.approx(float(p), abs=0.02)
    assert not news.exposure(np.full(n, "35-54"), np.full(n, "DEU"), 0.0, 0, rng).any()

import pytest

from rw import db, llm, population, reaction
from rw.reaction import PastPost, PostTestRequest, RetroRequest

DAY = "2026-10-01"
POST = "We cut our prices in half for students this week."


@pytest.fixture(scope="module")
def world():
    return population.sample_population(2000, 11)


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch, world):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    population.write_snapshot(DAY, world)


def test_a_post_test_weights_segments_and_reads_as_shares():
    budget = llm.Budget(1.0)
    out = reaction.run(PostTestRequest(text=POST, gut="lands"), db.connect(), budget)
    mix = out.mix
    assert abs(mix.scroll_past + mix.read + mix.like + mix.share - 1) < 1e-6
    assert abs(out.landing_chance - (mix.like + mix.share)) < 1e-6
    assert 0 <= out.band[0] <= out.band[1] <= 1
    assert out.segments == len(reaction.audience_segments(PostTestRequest(text=POST)))
    assert out.best[0].landing >= out.worst[0].landing
    assert len(out.audiences) == out.segments and out.audiences[0] == out.best[0]
    assert [v.simulated for v in out.voices] == ["Simulated account"] * 2
    assert out.provider == "fake" and out.rewrite


def test_the_audience_filters_countries_and_ages():
    segs = reaction.audience_segments(
        PostTestRequest(text=POST, countries=["BRA"], age_bands=["18-34"])
    )
    assert segs and all(s.startswith("BRA|18-34|") for s, _ in segs)
    assert abs(sum(w for _, w in segs) - 1) < 1e-9


def test_a_test_over_its_cap_spends_nothing():
    conn = db.connect()
    with pytest.raises(llm.BudgetExceeded):
        reaction.run(PostTestRequest(text=POST), conn, llm.Budget(1e-9))
    assert conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0] == 0


def test_the_retrospective_check_scores_each_post():
    req = RetroRequest(
        posts=[
            PastPost(text=POST, outcome="landed"),
            PastPost(text="Nothing new today.", outcome="flopped"),
        ]
    )
    out = reaction.retrospective(req, db.connect(), llm.Budget(1.0))
    assert len(out.posts) == 2 and out.label == "Retrospective: not on your record"
    for p in out.posts:
        assert p.hit == ((p.landing_chance >= 0.5) == (p.outcome == "landed"))
    assert out.hits == sum(p.hit for p in out.posts)

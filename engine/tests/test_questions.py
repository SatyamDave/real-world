import csv
import hashlib
import json
from urllib.parse import urlparse

import pytest

from rw import daily, forecast, sources

PROPOSED = forecast.QUESTION_LISTS / "2026-10-proposed.json"


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


def write_list(folder, name, status):
    data = json.loads(PROPOSED.read_text())
    data["status"] = status
    path = folder / name
    path.write_text(json.dumps(data))
    return path


@pytest.mark.parametrize("status", ["proposed", "", None])
def test_live_refuses_a_list_that_is_not_approved(tmp_path, monkeypatch, status):
    monkeypatch.setattr(forecast, "QUESTION_LISTS", tmp_path)
    write_list(tmp_path, "a.json", "approved")
    write_list(tmp_path, "b.json", status)
    with pytest.raises(forecast.ListNotApproved, match="b.json"):
        forecast.load_questions("live")


def test_live_refuses_a_bare_list_and_an_empty_folder(tmp_path, monkeypatch):
    monkeypatch.setattr(forecast, "QUESTION_LISTS", tmp_path)
    with pytest.raises(forecast.ListNotApproved, match="no question list"):
        forecast.load_questions("live")
    (tmp_path / "bare.json").write_text(json.dumps(json.loads(PROPOSED.read_text())["questions"]))
    with pytest.raises(forecast.ListNotApproved, match="bare.json"):
        forecast.load_questions("live")


def test_the_committed_draft_is_refused():
    with pytest.raises(forecast.ListNotApproved, match="'proposed'"):
        forecast.load_questions("live")


def test_an_approved_list_loads_with_its_file_hash(tmp_path, monkeypatch):
    monkeypatch.setattr(forecast, "QUESTION_LISTS", tmp_path)
    path = write_list(tmp_path, "a.json", "approved")
    [(set_hash, qs)] = forecast.question_sets("live")
    assert set_hash == hashlib.sha256(path.read_bytes()).hexdigest()
    assert [q["id"] for q in qs] == [q["id"] for q in json.loads(PROPOSED.read_text())["questions"]]


def test_fixtures_stay_the_default():
    assert forecast.load_questions() == forecast.load_questions("fixtures")
    assert all(q["id"].startswith("fx-") for q in forecast.load_questions())


def test_daily_refuses_a_proposed_list_before_any_step(capsys):
    assert daily.main(["--date", "2026-10-14", "--questions", "live"]) == 1
    assert "question list refused, nothing ran" in capsys.readouterr().err
    assert not daily.settings.rw_home().exists()


def test_fixture_days_cannot_take_live_questions():
    with pytest.raises(SystemExit):
        daily.main(["--fixtures", "--questions", "live"])


def test_the_draft_is_well_formed():
    data = json.loads(PROPOSED.read_text())
    assert data["status"] == "proposed"
    qs = data["questions"]
    data_dir = sources.SOURCES_CSV.parent
    with (data_dir / "topics.csv").open(newline="") as f:
        topics = {r["topic"] for r in csv.DictReader(f)}
    with (data_dir / "countries.csv").open(newline="") as f:
        countries = {r["iso3"] for r in csv.DictReader(f)}
    assert len({q["id"] for q in qs}) == len(qs)
    assert {c for q in qs for c in q["countries"]} == countries
    for q in qs:
        assert not q["id"].startswith("fx-") and "FIXTURE" not in q["text"]
        assert q["topic"] in topics
        assert set(q["countries"]) <= countries
        assert q["opens"] <= q["closes"] < q["event_date"] <= q["resolves_by"]
        assert q["market_source"] == ""
        url = urlparse(q["resolution_source"])
        assert url.scheme == "https" and url.hostname not in {"example.com", "wikipedia.org"}

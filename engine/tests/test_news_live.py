import csv
import io
import os
import urllib.error
import zipfile
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from rw import daily, db, llm, news, settings, sources

DAY = "2026-10-11"
SAMPLE = (Path(__file__).parent / "data" / "gkg-20261011120000.csv.zip").read_bytes()


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


def gkg_zip(lines: list[str]) -> bytes:
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as z:
        z.writestr("x.gkg.csv", "".join(lines))
    return out.getvalue()


with zipfile.ZipFile(io.BytesIO(SAMPLE)) as _z:
    SAMPLE_LINES = _z.read("20261011120000.gkg.csv").decode().splitlines(keepends=True)


def serve(monkeypatch, at_noon: bytes = SAMPLE, other: bytes | None = gkg_zip([])) -> list[str]:
    """Answer the 12:00 slot with at_noon and every other slot with other."""
    urls: list[str] = []

    def download(url):
        urls.append(url)
        return at_noon if url.endswith(f"{DAY.replace('-', '')}120000.gkg.csv.zip") else other

    monkeypatch.setattr(news, "_download", download)
    return urls


def read(path):
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def test_fetch_writes_the_fixture_shape_from_all_96_slots(monkeypatch):
    urls = serve(monkeypatch)
    rows = read(news.fetch_gdelt_day(DAY))

    assert len(urls) == 96
    assert urls[0].endswith("/20261011000000.gkg.csv.zip")
    assert urls[-1].endswith("/20261011234500.gkg.csv.zip")
    fixture = read(news.DATA / "fixtures" / "news" / "2026-10-01.csv")
    assert list(rows[0]) == list(fixture[0]) == news.NEWS_COLUMNS
    assert len(rows) == 12
    assert {r["iso3"] for r in rows} == {"GBR", "IND", "ISR", "USA"}
    assert {r["theme"] for r in rows} <= news.GKG_THEMES
    assert all(r["date"] == DAY and int(r["num_sources"]) == 1 for r in rows)
    isr = [r for r in rows if r["iso3"] == "ISR"]
    assert isr == [
        {
            "date": DAY,
            "iso3": "ISR",
            "theme": "ARMEDCONFLICT",
            "tone": "-3.2",
            "num_sources": "1",
            "title": "Iran: I Stopped Them From Destroying Israel, The Middle East, And Europe"
            " – Trump – Ghanamma.com",
            "url": isr[0]["url"],
        }
    ]
    assert isr[0]["url"].startswith("https://")


def test_same_title_counts_distinct_sources_and_keeps_the_top_titles(monkeypatch):
    ghana = next(line for line in SAMPLE_LINES if "ghanamma.com" in line)
    other = ghana.replace("\tghanamma.com\t", "\tother.example\t", 1)
    serve(monkeypatch, gkg_zip([*SAMPLE_LINES, other, ghana]))
    monkeypatch.setattr(settings, "NEWS_TITLES_PER_THEME", 1)
    rows = read(news.fetch_gdelt_day(DAY))

    usa = [r for r in rows if r["iso3"] == "USA"]
    assert [(r["theme"], r["num_sources"]) for r in usa] == [("ARMEDCONFLICT", "2")]
    assert usa[0]["title"].startswith("Iran: I Stopped Them")
    assert len([r for r in rows if (r["iso3"], r["theme"]) == ("IND", "ELECTION")]) == 1


def test_a_missing_slot_or_an_empty_day_writes_nothing(monkeypatch):
    serve(monkeypatch, other=None)
    with pytest.raises(news.NewsUnavailable, match="20261011000000.gkg.csv.zip: missing"):
        news.fetch_gdelt_day(DAY)
    assert not news.live_news_path(DAY).exists()

    serve(monkeypatch, at_noon=gkg_zip(SAMPLE_LINES[-2:]))
    with pytest.raises(news.NewsUnavailable, match="no GDELT articles"):
        news.fetch_gdelt_day(DAY)
    assert not news.live_news_path(DAY).exists()


def test_download_maps_404_to_none_and_other_failures_to_news_unavailable(monkeypatch):
    def fail_with(exc):
        def urlopen(url, timeout):
            assert timeout == settings.GDELT_TIMEOUT_S
            raise exc

        monkeypatch.setattr(news.urllib.request, "urlopen", urlopen)

    fail_with(urllib.error.HTTPError("u", 404, "Not Found", {}, None))  # type: ignore[arg-type]
    assert news._download("u") is None
    fail_with(urllib.error.HTTPError("u", 503, "Unavailable", {}, None))  # type: ignore[arg-type]
    with pytest.raises(news.NewsUnavailable, match="u: HTTP 503"):
        news._download("u")
    fail_with(urllib.error.URLError("timed out"))
    with pytest.raises(news.NewsUnavailable, match="u: .*timed out"):
        news._download("u")


def test_the_licence_gate_runs_before_any_download(monkeypatch):
    urls = serve(monkeypatch)

    def require(source_id):
        raise sources.SourceNotCleared(source_id)

    monkeypatch.setattr(sources, "require", require)
    with pytest.raises(sources.SourceNotCleared, match="gdelt"):
        news.fetch_gdelt_day(DAY)
    assert urls == []


def test_live_ingest_uses_the_saved_day_and_no_fixture_polls(monkeypatch):
    urls = serve(monkeypatch)
    conn = db.connect()
    news.ingest_day(conn, DAY, llm.Budget(1.0), live=True)

    kept = news.clusters(read(news.live_news_path(DAY)))
    clusters = conn.execute("SELECT DISTINCT cluster_id FROM signals WHERE date = ?", (DAY,))
    assert {r[0] for r in clusters} == {f"{DAY}|{c['iso3']}|{c['theme']}" for c in kept}
    assert conn.execute("SELECT count(*) FROM observations").fetchone()[0] == 0

    urls.clear()
    news.ingest_day(conn, DAY, llm.Budget(1.0), live=True)
    assert urls == []


def test_daily_cli_selects_live_news_and_stops_when_there_is_none(monkeypatch, capsys):
    with pytest.raises(SystemExit):
        daily.main(["--fixtures", "--news", "live"])

    serve(monkeypatch, other=None)
    assert daily.main(["--date", DAY, "--news", "live"]) == 1
    assert "no news, run stopped before forecasting" in capsys.readouterr().err
    conn = db.connect()
    runs = conn.execute("SELECT step, status FROM stage_runs WHERE date = ?", (DAY,)).fetchall()
    assert [tuple(r) for r in runs] == [("ingest", "failed")]

    serve(monkeypatch)
    assert daily.main(["--date", DAY, "--news", "live", "--step", "ingest"]) == 0
    detail = conn.execute("SELECT detail FROM stage_runs WHERE step = 'ingest'").fetchone()[0]
    assert '"news": "gdelt"' in detail


@pytest.mark.skipif(os.environ.get("RW_LIVE_TESTS") != "1", reason="set RW_LIVE_TESTS=1")
def test_live_gdelt_yesterday():
    day = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%d")
    rows = read(news.fetch_gdelt_day(day))
    assert rows and {r["iso3"] for r in rows} <= set(news.country_names())

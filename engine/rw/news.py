"""Turn a day's news into per-topic signals and its polls into observations, and decide exposure."""

import csv
import html
import io
import re
import sqlite3
import urllib.error
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta
from functools import cache
from typing import Any

import numpy as np

from rw import llm, settings, sources

DATA = sources.SOURCES_CSV.parent
NEWS_SOURCE = "fixture_news"
LIVE_NEWS_SOURCE = "gdelt"
POLLS_SOURCE = "fixture_polls"
REACH_SOURCE = "fixture_sample"
# Belongs in settings.py, which this slice may not touch; move it there in a follow-up.
CLUSTERS_PER_COUNTRY = 3
NEWS_COLUMNS = ["date", "iso3", "theme", "tone", "num_sources", "title", "url"]
GDELT_URL = "https://data.gdeltproject.org/gdeltv2/{slot}.gkg.csv.zip"
# GKG location country codes are FIPS 10-4, not ISO.
FIPS_TO_ISO3 = {
    "US": "USA", "UK": "GBR", "GM": "DEU", "FR": "FRA", "JA": "JPN", "BR": "BRA", "MX": "MEX",
    "ID": "IDN", "SF": "ZAF", "TU": "TUR", "IS": "ISR", "IN": "IND", "NI": "NGA", "KE": "KEN",
    "EG": "EGY", "CH": "CHN",
}  # fmt: skip
# No AI theme appeared in sampled GKG files; TECH_AUTOMATION is the nearest. TAX_FNCACT tags
# actor roles in almost every article, so it carries no topic.
GKG_THEMES = frozenset(
    {
        "ARMEDCONFLICT", "ECON_INFLATION", "ECON_OILPRICE", "ECON_STOCKMARKET", "ELECTION",
        "ENV_CLIMATECHANGE", "IMMIGRATION", "PROTEST", "TECH_AUTOMATION",
    }
)  # fmt: skip
PAGE_TITLE = re.compile(r"<PAGE_TITLE>(.*?)</PAGE_TITLE>", re.S)


class NewsUnavailable(Exception):
    pass


def _read(path) -> list[dict[str, str]]:
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


@cache
def topics() -> dict[str, str]:
    return {r["topic"]: r["question_text"] for r in _read(DATA / "topics.csv")}


@cache
def country_names() -> dict[str, str]:
    return {r["iso3"]: r["name"] for r in _read(DATA / "countries.csv")}


SIGNAL_LEVELS = [
    "makes a yes answer much less likely",
    "makes a yes answer somewhat less likely",
    "unrelated, or no effect",
    "makes a yes answer somewhat more likely",
    "makes a yes answer much more likely",
]


def signal_questions() -> llm.Questions:
    """One Jev score per topic, its levels spread over [-1, 1], and a noul for salience."""
    qs: llm.Questions = {
        t: {
            "type": "score",
            "instructions": f"How does this news move these people on the question: {q}",
            "criteria": SIGNAL_LEVELS,
        }
        for t, q in topics().items()
    }
    qs["salience"] = {
        "type": "noul",
        "instructions": "Would an ordinary person among these people notice this news?",
    }
    return qs


def extract_signal(
    text: str,
    audience: str | None,
    budget: llm.Budget,
    conn: sqlite3.Connection | None = None,
    purpose: str = "signal",
) -> dict[str, float]:
    """Return {topic: push in [-1, 1], ..., "salience": [0, 1]} for one piece of news."""
    who = audience or "the general public of the country the news is from"
    state = f"People: {who}\nNews:\n{text}"
    out = llm.decide(purpose, state, signal_questions(), budget, conn=conn)
    signal = {t: llm.level_value(out[t], -1, 1) for t in topics()}
    signal["salience"] = float(out["salience"]["noul"])
    return signal


def clusters(rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    """Group rows by (iso3, theme) and keep the CLUSTERS_PER_COUNTRY most-sourced per country."""
    groups: dict[tuple[str, str], list[dict[str, str]]] = defaultdict(list)
    for r in rows:
        groups[(r["iso3"], r["theme"])].append(r)
    by_country: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for (iso3, theme), members in sorted(groups.items()):
        members.sort(key=lambda r: -int(r["num_sources"]))
        by_country[iso3].append(
            {
                "iso3": iso3,
                "theme": theme,
                "num_sources": sum(int(r["num_sources"]) for r in members),
                "title": members[0]["title"],
                "titles": [r["title"] for r in members],
            }
        )
    return [
        c
        for iso3 in sorted(by_country)
        for c in sorted(by_country[iso3], key=lambda c: -c["num_sources"])[:CLUSTERS_PER_COUNTRY]
    ]


def live_news_path(date: str):
    return settings.rw_home() / "news" / f"{date}.csv"


def _download(url: str) -> bytes | None:
    """The body at url, or None when GDELT has no file there (404)."""
    try:
        with urllib.request.urlopen(url, timeout=settings.GDELT_TIMEOUT_S) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise NewsUnavailable(f"{url}: HTTP {e.code}") from e
    except (urllib.error.URLError, OSError) as e:
        raise NewsUnavailable(f"{url}: {e}") from e


def gkg_records(data: bytes):
    """Yield (iso3, theme, tone, source, title, url) for each base country and kept theme of
    each article in one GKG 2.1 zip."""
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        text = z.read(z.namelist()[0]).decode("utf-8", errors="replace")
    for line in text.splitlines():
        f = line.split("\t")
        if len(f) < 27:
            continue
        title = PAGE_TITLE.search(f[26])
        if title is None:
            continue
        title = " ".join(html.unescape(title.group(1)).split())
        themes = GKG_THEMES.intersection(f[7].split(";"))
        fips = {loc.split("#")[2] for loc in f[9].split(";") if loc.count("#") >= 2}
        countries = {FIPS_TO_ISO3[c] for c in fips if c in FIPS_TO_ISO3}
        if not (title and themes and countries):
            continue
        tone = float(f[15].split(",")[0])
        for iso3 in countries:
            for theme in themes:
                yield iso3, theme, tone, f[3], title, f[4]


def fetch_gdelt_day(date: str):
    """Write the day's GDELT GKG news to live_news_path(date) in the fixture CSV shape.

    Reads all 96 fifteen-minute GKG files of the UTC day; any missing file, network error or a
    day with no kept rows raises NewsUnavailable and writes nothing."""
    sources.require(LIVE_NEWS_SOURCE)
    start = datetime.strptime(date, "%Y-%m-%d")
    groups: dict[tuple[str, str, str], dict[str, Any]] = {}
    for i in range(96):
        url = GDELT_URL.format(slot=(start + timedelta(minutes=15 * i)).strftime("%Y%m%d%H%M%S"))
        data = _download(url)
        if data is None:
            raise NewsUnavailable(f"{url}: missing, so {date} is incomplete")
        for iso3, theme, tone, source, title, url_ in gkg_records(data):
            g = groups.setdefault((iso3, theme, title.casefold()), {"sources": set(), "tones": []})
            g["sources"].add(source)
            g["tones"].append(tone)
            g.setdefault("title", title)
            g["url"] = min(g.get("url", url_), url_)
    if not groups:
        raise NewsUnavailable(f"{date}: no GDELT articles on the kept themes in the base countries")

    by_theme: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for (iso3, theme, _), g in groups.items():
        by_theme[(iso3, theme)].append(
            {
                "date": date,
                "iso3": iso3,
                "theme": theme,
                "tone": round(sum(g["tones"]) / len(g["tones"]), 1),
                "num_sources": len(g["sources"]),
                "title": g["title"],
                "url": g["url"],
            }
        )
    rows = [
        r
        for key in sorted(by_theme)
        for r in sorted(by_theme[key], key=lambda r: (-r["num_sources"], r["title"]))[
            : settings.NEWS_TITLES_PER_THEME
        ]
    ]
    path = live_news_path(date)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with tmp.open("w", newline="") as f:
        w = csv.DictWriter(f, NEWS_COLUMNS)
        w.writeheader()
        w.writerows(rows)
    tmp.replace(path)
    return path


def ingest_day(conn: sqlite3.Connection, date: str, budget: llm.Budget, live: bool = False) -> None:
    """Ingest the day's news (fixture, or GDELT when live) and, for fixture days, its polls."""
    if live:
        sources.require(LIVE_NEWS_SOURCE)
        path = live_news_path(date)
        news = _read(path if path.exists() else fetch_gdelt_day(date))
        polls = []
    else:
        sources.require(NEWS_SOURCE)
        sources.require(POLLS_SOURCE)
        news = _read(DATA / "fixtures" / "news" / f"{date}.csv")
        polls_path = DATA / "fixtures" / "polls" / f"{date}.csv"
        polls = _read(polls_path) if polls_path.exists() else []
    for source_id in sorted({p["source_id"] for p in polls}):
        sources.require(source_id)

    with conn:
        conn.executemany(
            "INSERT OR IGNORE INTO observations (date, iso3, topic, share, n, source_id)"
            " VALUES (?, ?, ?, ?, ?, ?)",
            [
                (date, p["iso3"], p["topic"], float(p["share"]), int(p["n"]), p["source_id"])
                for p in polls
            ],
        )

    done = {r[0] for r in conn.execute("SELECT cluster_id FROM signals WHERE date = ?", (date,))}
    for c in clusters(news):
        cluster_id = f"{date}|{c['iso3']}|{c['theme']}"
        if cluster_id in done:
            continue
        # Tone stays out of the prompt until it is validated against outcomes (research/data/050).
        text = f"{country_names()[c['iso3']]}, {date}:\n" + "\n".join(f"- {t}" for t in c["titles"])
        signal = extract_signal(text, None, budget, conn=conn)
        with conn:
            conn.executemany(
                "INSERT INTO signals (date, cluster_id, iso3, title, salience, topic, value)"
                " VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    (date, cluster_id, c["iso3"], c["title"], signal["salience"], t, signal[t])
                    for t in topics()
                ],
            )


@cache
def reach() -> dict[tuple[str, str], float]:
    sources.require(REACH_SOURCE)
    rows = _read(DATA / "sample" / "channel_reach.csv")
    return {(r["iso3"], r["age_band"]): float(r["reach"]) for r in rows}


def exposure_probability(age_band, iso3, salience, days_since) -> np.ndarray:
    iso3, age_band = np.broadcast_arrays(np.asarray(iso3), np.asarray(age_band))
    table = reach()
    r = np.array([table[(c, a)] for c, a in zip(iso3.ravel(), age_band.ravel(), strict=True)])
    decay = 0.5 ** (np.asarray(days_since, dtype=float) / settings.ATTENTION_HALF_LIFE_DAYS)
    return r.reshape(iso3.shape) * np.asarray(salience, dtype=float) * decay


def exposure(age_band, iso3, salience, days_since, rng: np.random.Generator) -> np.ndarray:
    """Boolean mask of who hears a signal: reach x salience x attention decay."""
    p = exposure_probability(age_band, iso3, salience, days_since)
    return rng.random(p.shape) < p

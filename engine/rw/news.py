"""Turn a day's news into per-topic signals and its polls into observations, and decide exposure."""

import csv
import sqlite3
from collections import defaultdict
from functools import cache
from typing import Any

import numpy as np

from rw import llm, settings, sources

DATA = sources.SOURCES_CSV.parent
NEWS_SOURCE = "fixture_news"
POLLS_SOURCE = "fixture_polls"
REACH_SOURCE = "fixture_sample"
# Belongs in settings.py, which this slice may not touch; move it there in a follow-up.
CLUSTERS_PER_COUNTRY = 3


def _read(path) -> list[dict[str, str]]:
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


@cache
def topics() -> dict[str, str]:
    return {r["topic"]: r["question_text"] for r in _read(DATA / "topics.csv")}


@cache
def country_names() -> dict[str, str]:
    return {r["iso3"]: r["name"] for r in _read(DATA / "countries.csv")}


def signal_schema() -> llm.Schema:
    props: dict[str, Any] = {t: {"type": "number", "minimum": -1, "maximum": 1} for t in topics()}
    props["salience"] = {"type": "number", "minimum": 0, "maximum": 1}
    return {
        "type": "object",
        "properties": props,
        "required": list(props),
        "additionalProperties": False,
    }


def extract_signal(
    text: str, audience: str | None, budget: llm.Budget, conn: sqlite3.Connection | None = None
) -> dict[str, float]:
    """Return {topic: push in [-1, 1], ..., "salience": [0, 1]} for one piece of news."""
    questions = "\n".join(f"- {t}: {q}" for t, q in topics().items())
    who = audience or "the general public of the country the news is from"
    prompt = (
        "Rate how this news moves the people described below on each topic.\n"
        "For each topic give a number from -1 to 1: positive if the news makes a yes answer to"
        " the question more likely, negative if less likely, 0 if unrelated.\n"
        "Also give salience from 0 to 1: how likely an ordinary person is to notice this news.\n"
        f"People: {who}\n"
        f"Topics:\n{questions}\n"
        f"News:\n{text}"
    )
    out = llm.complete_json("signal", prompt, signal_schema(), budget, conn=conn)
    # A provider schema check can loosen numeric bounds, so the range is enforced here too.
    signal = {t: float(np.clip(out[t], -1, 1)) for t in topics()}
    signal["salience"] = float(np.clip(out["salience"], 0, 1))
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


def ingest_day(conn: sqlite3.Connection, date: str, budget: llm.Budget) -> None:
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

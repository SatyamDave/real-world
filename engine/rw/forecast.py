"""Three forecasts per open question per day: the blind simulation, a plain LLM, and the market.

The sim path reads the population and the day's signals only; market prices enter forecast_day
after the sim number is fixed, as metadata for scoring (decision 0002).
"""

import csv
import hashlib
import json
import random
import sqlite3
from datetime import UTC, datetime
from typing import Any

import numpy as np

from rw import ledger, llm, news, settings, sources
from rw.population import Agents

FIXTURES = sources.SOURCES_CSV.parent / "fixtures"
MARKETS_SOURCE = "fixture_markets"
# Belongs in settings.py, which this slice may not touch; move it there in a follow-up.
HEADLINES_PER_QUESTION = 8
# Keeps logit finite when the model answers exactly 0 or 1.
P_EPS = 1e-4

Question = dict[str, Any]

ANSWER_SCHEMA: llm.Schema = {
    "type": "object",
    "properties": {
        "yes": {"type": "number", "minimum": 0, "maximum": 1},
        "no": {"type": "number", "minimum": 0, "maximum": 1},
    },
    "required": ["yes", "no"],
    "additionalProperties": False,
}


def load_questions() -> list[Question]:
    return json.loads((FIXTURES / "questions.json").read_text())


def question_hash(q: Question) -> str:
    return ledger.sha256_hex(ledger.canonical_json(q))


def open_questions(date: str) -> list[Question]:
    return [q for q in load_questions() if q["opens"] <= date <= q["closes"]]


def market_price(question_id: str, date: str) -> float:
    """The latest fixture price on or before date."""
    sources.require(MARKETS_SOURCE)
    with (FIXTURES / "markets.csv").open(newline="") as f:
        rows = [r for r in csv.DictReader(f) if r["question_id"] == question_id]
    rows = [r for r in rows if r["date"] <= date]
    if not rows:
        raise ValueError(f"no market price for {question_id} on or before {date}")
    return float(max(rows, key=lambda r: r["date"])["price"])


def headlines(conn: sqlite3.Connection, date: str, countries: list[str]) -> list[str]:
    marks = ",".join("?" * len(countries))
    rows = conn.execute(
        f"SELECT title FROM signals WHERE date = ? AND iso3 IN ({marks})"
        " GROUP BY title ORDER BY MAX(salience) DESC, title LIMIT ?",
        (date, *countries, HEADLINES_PER_QUESTION),
    ).fetchall()
    return [r[0] for r in rows]


def _news_block(titles: list[str]) -> str:
    lines = "\n".join(f"- {t}" for t in titles) or "- (no headlines today)"
    return f"Today's headlines:\n{lines}\n"


def _yes_share(answer: dict[str, Any]) -> float:
    yes, no = float(answer["yes"]), float(answer["no"])
    return yes / (yes + no) if yes + no > 0 else 0.5


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-x))


def _segment_text(segment: str) -> str:
    iso3, age_band, education = segment.split("|")
    return f"adults aged {age_band} in {news.country_names()[iso3]} with {education} education"


def sim_prompt(date: str, q: Question, titles: list[str], segment: str, share: float) -> str:
    options = ["yes", "no"]
    random.Random(f"{date}|{q['id']}|{segment}").shuffle(options)
    return (
        _news_block(titles) + f"\nYou answer for this group of people: {_segment_text(segment)}.\n"
        f"Today {share:.0%} of them answer yes to: {news.topics()[q['topic']]}\n"
        f"\nQuestion: {q['text']}\n"
        f"Options, in this order: {', '.join(options)}.\n"
        "Give the share of this group that would answer each option, as numbers from 0 to 1."
    )


def sim_forecast(
    conn: sqlite3.Connection, date: str, q: Question, agents: Agents, budget: llm.Budget
) -> tuple[float, float, float]:
    """Return (probability, p10, p90) from one call per present segment, spread to agents."""
    in_q = np.isin(agents["country"], q["countries"])
    if not in_q.any():
        raise ValueError(f"no agents in {q['countries']} for {q['id']}")
    segments = agents["segment"][in_q]
    beliefs = agents[f"b_{q['topic']}"][in_q]
    offsets = agents["offset"][in_q]
    titles = headlines(conn, date, q["countries"])

    logits = np.empty(len(segments))
    for seg in sorted(set(segments.tolist())):
        mask = segments == seg
        share = float(_sigmoid(beliefs[mask]).mean())
        prompt = sim_prompt(date, q, titles, seg, share)
        p = _yes_share(llm.complete_json("forecast_sim", prompt, ANSWER_SCHEMA, budget, conn=conn))
        p = float(np.clip(p, P_EPS, 1 - P_EPS))
        logits[mask] = np.log(p / (1 - p))

    agent_p = _sigmoid(logits + offsets)
    prob = float(agent_p.mean())
    seed = int.from_bytes(hashlib.sha256(f"{date}|{q['id']}".encode()).digest()[:8], "big")
    rng = np.random.default_rng(seed)
    picks = rng.integers(0, len(agent_p), (settings.DAILY_FORECAST_MEMBERS, len(agent_p)))
    p10, p90 = np.quantile(agent_p[picks].mean(axis=1), [0.1, 0.9])
    # A handful of members can all land on one side of the full mean.
    return prob, min(float(p10), prob), max(float(p90), prob)


def plain_prompt(q: Question, titles: list[str], sample: int) -> str:
    return (
        _news_block(titles) + f"\nQuestion: {q['text']}\n"
        f"Resolves by {q['resolves_by']}.\n"
        f"This is independent forecast {sample + 1} of {settings.PLAIN_LLM_SAMPLES}.\n"
        "Give the probability of yes and of no, as numbers from 0 to 1."
    )


def plain_llm_forecast(
    conn: sqlite3.Connection, date: str, q: Question, budget: llm.Budget
) -> float:
    titles = headlines(conn, date, q["countries"])
    ps = sorted(
        _yes_share(
            llm.complete_json(
                "forecast_plain", plain_prompt(q, titles, i), ANSWER_SCHEMA, budget, conn=conn
            )
        )
        for i in range(settings.PLAIN_LLM_SAMPLES)
    )
    kept = ps[1:-1] if len(ps) > 2 else ps
    return sum(kept) / len(kept)


def forecast_day(conn: sqlite3.Connection, date: str, agents: Agents, budget: llm.Budget) -> None:
    """Write sim, plain_llm and market rows for every question open on date; skip done ones."""
    done = {
        r[0]
        for r in conn.execute("SELECT DISTINCT question_id FROM forecasts WHERE date = ?", (date,))
    }
    model = "fake" if llm.provider().name == "fake" else settings.MODEL
    for q in open_questions(date):
        if q["id"] in done:
            continue
        p, p10, p90 = sim_forecast(conn, date, q, agents, budget)
        plain = plain_llm_forecast(conn, date, q, budget)
        price = market_price(q["id"], date)
        now = datetime.now(UTC).isoformat(timespec="seconds")
        with conn:
            conn.executemany(
                "INSERT INTO forecasts (date, question_id, forecaster, probability, p10, p90,"
                " market_price_at_commit, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (date, q["id"], "sim", p, p10, p90, price, model, now),
                    (date, q["id"], "plain_llm", plain, None, None, price, model, now),
                    (date, q["id"], "market", price, None, None, price, None, now),
                ],
            )

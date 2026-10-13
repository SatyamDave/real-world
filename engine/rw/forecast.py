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
QUESTION_LISTS = sources.SOURCES_CSV.parent / "questions"
MARKETS_SOURCE = "fixture_markets"

Question = dict[str, Any]


class ListNotApproved(ValueError):
    """A live question list that the founder has not approved (data/questions/README.md)."""


def question_sets(which: str = "fixtures") -> list[tuple[str, list[Question]]]:
    """(sha256 of the file bytes, its questions) for each list. Live lists must be approved."""
    if which == "fixtures":
        raw = (FIXTURES / "questions.json").read_bytes()
        return [(ledger.sha256_hex(raw), json.loads(raw))]
    paths = sorted(QUESTION_LISTS.glob("*.json"))
    if not paths:
        raise ListNotApproved(f"no question list in {QUESTION_LISTS}")
    sets = []
    for path in paths:
        raw = path.read_bytes()
        data = json.loads(raw)
        status = data.get("status") if isinstance(data, dict) else None
        if status != "approved":
            raise ListNotApproved(f"{path.name} has status {status!r}; only an approved list runs")
        sets.append((ledger.sha256_hex(raw), data["questions"]))
    return sets


def load_questions(which: str = "fixtures") -> list[Question]:
    return [q for _, qs in question_sets(which) for q in qs]


def question_hash(q: Question) -> str:
    return ledger.sha256_hex(ledger.canonical_json(q))


def open_questions(date: str, which: str = "fixtures") -> list[Question]:
    return [q for q in load_questions(which) if q["opens"] <= date <= q["closes"]]


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
        (date, *countries, settings.HEADLINES_PER_QUESTION),
    ).fetchall()
    return [r[0] for r in rows]


def _news_block(titles: list[str]) -> str:
    lines = "\n".join(f"- {t}" for t in titles) or "- (no headlines today)"
    return f"Today's headlines:\n{lines}\n"


def sim_share(answers: dict[str, Any]) -> float:
    """The group's yes share from a stored `decide` answer to sim_questions."""
    return float(answers["answer"]["probabilities"]["yes"])


def plain_share(answers: dict[str, Any]) -> float:
    """The yes probability from a stored `decide` answer to PLAIN_QUESTIONS."""
    return float(answers["resolves_yes"]["noul"])


def sim_questions(date: str, q: Question, segment: str) -> llm.Questions:
    """One Jev choice whose yes probability is the group's yes share. The option order is seeded
    per segment so no single order biases every segment."""
    options = ["yes", "no"]
    random.Random(f"{date}|{q['id']}|{segment}").shuffle(options)
    return {
        "answer": {
            "type": "choice",
            "instructions": f"How would a randomly chosen member of this group answer: {q['text']}",
            "criteria": dict.fromkeys(options),
        }
    }


PLAIN_QUESTIONS: llm.Questions = {
    "resolves_yes": {
        "type": "noul",
        "instructions": "Will the question in the state resolve yes by its resolution date?",
    }
}


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-x))


def segment_text(segment: str) -> str:
    iso3, age_band, education = segment.split("|")
    return f"adults aged {age_band} in {news.country_names()[iso3]} with {education} education"


def sim_prompt(date: str, q: Question, titles: list[str], segment: str, share: float) -> str:
    return (
        _news_block(titles) + f"\nGroup of people: {segment_text(segment)}.\n"
        f"Today {share:.0%} of them answer yes to: {news.topics()[q['topic']]}\n"
        f"\nQuestion: {q['text']}\n"
    )


def sim_inputs(
    conn: sqlite3.Connection, date: str, q: Question, agents: Agents
) -> tuple[np.ndarray, list[tuple[str, np.ndarray, float, str]]]:
    """The question's agent offsets and, per present segment, (segment, agent mask over those
    agents, the segment's prior share, the prompt the model is asked)."""
    in_q = np.isin(agents["country"], q["countries"])
    if not in_q.any():
        raise ValueError(f"no agents in {q['countries']} for {q['id']}")
    segments = agents["segment"][in_q]
    beliefs = agents[f"b_{q['topic']}"][in_q]
    titles = headlines(conn, date, q["countries"])
    asks = []
    for seg in sorted(set(segments.tolist())):
        mask = segments == seg
        share = float(_sigmoid(beliefs[mask]).mean())
        asks.append((seg, mask, share, sim_prompt(date, q, titles, seg, share)))
    return agents["offset"][in_q], asks


def sim_forecast(
    conn: sqlite3.Connection, date: str, q: Question, agents: Agents, budget: llm.Budget
) -> tuple[float, float, float]:
    """Return (probability, p10, p90) from one call per present segment, spread to agents."""
    offsets, asks = sim_inputs(conn, date, q, agents)
    logits = np.empty(len(offsets))
    for seg, mask, _, prompt in asks:
        answers = llm.decide("forecast_sim", prompt, sim_questions(date, q, seg), budget, conn=conn)
        logits[mask] = segment_logit(sim_share(answers))
    return sim_summary(date, q["id"], logits, offsets)


def segment_logit(share: float) -> float:
    p = float(np.clip(share, settings.P_EPS, 1 - settings.P_EPS))
    return float(np.log(p / (1 - p)))


def sim_summary(
    date: str, question_id: str, logits: np.ndarray, offsets: np.ndarray
) -> tuple[float, float, float]:
    """(probability, p10, p90) of the agents' answers: each draws its segment's logit plus its own
    offset, and the spread is a bootstrap of DAILY_FORECAST_MEMBERS means."""
    agent_p = _sigmoid(logits + offsets)
    prob = float(agent_p.mean())
    seed = int.from_bytes(hashlib.sha256(f"{date}|{question_id}".encode()).digest()[:8], "big")
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
    )


def plain_mean(samples: list[float]) -> float:
    """The mean of the samples without the lowest and the highest."""
    ps = sorted(samples)
    kept = ps[1:-1] if len(ps) > 2 else ps
    return sum(kept) / len(kept)


def plain_llm_forecast(
    conn: sqlite3.Connection, date: str, q: Question, budget: llm.Budget
) -> float:
    titles = headlines(conn, date, q["countries"])
    return plain_mean(
        [
            plain_share(
                llm.decide(
                    "forecast_plain", plain_prompt(q, titles, i), PLAIN_QUESTIONS, budget, conn=conn
                )
            )
            for i in range(settings.PLAIN_LLM_SAMPLES)
        ]
    )


def forecast_day(
    conn: sqlite3.Connection,
    date: str,
    agents: Agents,
    budget: llm.Budget,
    which: str = "fixtures",
) -> None:
    """Write sim, plain_llm and market rows for every question open on date; skip done ones."""
    done = {
        r[0]
        for r in conn.execute("SELECT DISTINCT question_id FROM forecasts WHERE date = ?", (date,))
    }
    model = llm.model_name()
    for q in open_questions(date, which):
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

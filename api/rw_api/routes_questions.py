"""GET /v1/questions/{question_id}: one question, every committed forecast by day and forecaster.

Contract: product/question.md. Numbers come from the ledger leaves, the forecasts and scores tables
and the recorded model calls; nothing is recomputed.
"""

import json
import re
import sqlite3

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rw import forecast, ledger, news, population, score, settings

router = APIRouter()

SEGMENT_PROMPT = re.compile(
    r"Group of people: adults aged (?P<age>.+) in (?P<country>.+) with "
    r"(?P<education>.+) education\.\nToday (?P<share>\d+)% of them answer yes"
)


def connect() -> sqlite3.Connection:
    # app.py imports this module, so it cannot be imported here at load time.
    from rw_api import app

    return app.connect()


class QuestionCountry(BaseModel):
    iso3: str
    name: str
    tier: str


class QuestionInfo(BaseModel):
    id: str
    text: str
    topic: str
    topic_label: str
    countries: list[QuestionCountry]
    opens: str
    closes: str
    resolves_by: str
    resolution_source: str
    tie_break: str
    market_source: str
    question_hash: str = Field(description="sha256 of the question as committed in each forecast.")
    question_set_hash: str = Field(description="sha256 of the question list this question is in.")
    daily_on: str | None


class QuestionOutcome(BaseModel):
    outcome: int
    resolved_on: str
    source_url: str
    read_on: str


class QuestionForecast(BaseModel):
    probability: float
    p10: float | None = Field(description="Only the sim forecaster has a spread.")
    p90: float | None
    brier: float | None = Field(description="Null until the question resolves.")
    log_score: float | None
    leaf_hash: str
    salt: str
    committed_at: str
    model: str
    market_price_at_commit: float


class SegmentAnswer(BaseModel):
    segment: str
    description: str
    prior_share: float = Field(description="The segment's share saying yes before the model call.")
    yes_share: float


class QuestionDay(BaseModel):
    date: str
    snapshot_sha256: str
    forecasts: dict[str, QuestionForecast] = Field(description="By forecaster.")
    segments: list[SegmentAnswer] = Field(
        description="The model's answer per segment behind the sim forecast; empty if not recorded."
    )
    plain_samples: list[float] = Field(description="Each plain LLM sample's yes share.")
    headlines: list[str]


class QuestionPage(BaseModel):
    question: QuestionInfo
    outcome: QuestionOutcome | None
    members: int = Field(description="Bootstrap resamples behind each sim spread.")
    plain_llm_samples: int
    log_clip: list[float] = Field(description="Low and high clip on p before the log score.")
    min_resolved: int = Field(description="Resolved questions before a skill claim is reported.")
    model: str | None
    provider: str | None
    days: list[QuestionDay] = Field(description="Oldest first.")


def _recorded_calls(
    conn: sqlite3.Connection, purpose: str, prefix: str, text: str
) -> list[sqlite3.Row]:
    """The model calls a day's forecast made, matched by the day's headline block and the question
    text in the prompt. Calls are matched by content because `at` is when they ran, not the
    forecast date. ponytail: two days with identical headlines share a prompt and its memoised call,
    so the call is shown on the first; give calls a forecast date column if that ever matters."""
    return conn.execute(
        "SELECT state AS prompt, output_json, model, provider FROM"
        " (SELECT json_extract(prompt, '$.state') AS state, output_json, model, provider, id"
        " FROM llm_calls WHERE purpose = ? AND output_json IS NOT NULL)"
        " WHERE instr(state, ?) = 1 AND instr(state, ?) > 0 ORDER BY id",
        (purpose, prefix, text),
    ).fetchall()


def _segments(conn: sqlite3.Connection, titles: list[str], text: str) -> list[SegmentAnswer]:
    iso3 = {name: code for code, name in news.country_names().items()}
    found: dict[str, SegmentAnswer] = {}
    for row in _recorded_calls(
        conn, "forecast_sim", forecast._news_block(titles), f"\nQuestion: {text}\n"
    ):
        m = SEGMENT_PROMPT.search(row["prompt"])
        share = forecast.sim_share(json.loads(row["output_json"]))
        if m is None or m["country"] not in iso3:
            continue
        key = f"{iso3[m['country']]}|{m['age']}|{m['education']}"
        found.setdefault(
            key,
            SegmentAnswer(
                segment=key,
                description=(
                    f"adults aged {m['age']} in {m['country']} with {m['education']} education"
                ),
                prior_share=int(m["share"]) / 100,
                yes_share=share,
            ),
        )
    return sorted(found.values(), key=lambda s: s.segment)


def _plain_samples(conn: sqlite3.Connection, titles: list[str], text: str) -> list[float]:
    rows = _recorded_calls(
        conn, "forecast_plain", forecast._news_block(titles), f"\nQuestion: {text}\n"
    )
    return [forecast.plain_share(json.loads(r["output_json"])) for r in rows][
        : settings.PLAIN_LLM_SAMPLES
    ]


@router.get(
    "/v1/questions/{question_id}",
    summary=(
        "One question: every committed forecast by day and forecaster, its spread, its receipt"
        " and its score"
    ),
    response_model=QuestionPage,
)
def question(question_id: str) -> QuestionPage:
    conn = connect()
    q = next((q for q in forecast.load_questions() if q["id"] == question_id), None)
    if q is None:
        raise HTTPException(404, f"no question {question_id}")
    set_hash = next(h for h, qs in forecast.question_sets() if any(x["id"] == q["id"] for x in qs))
    tiers = {c["iso3"]: population.coverage_tier(c) for c in population.countries()}
    names = news.country_names()
    topic_labels = {r["topic"]: r["label"] for r in news._read(news.DATA / "topics.csv")}
    res = conn.execute("SELECT * FROM resolutions WHERE question_id = ?", (q["id"],)).fetchone()
    scores = {
        (r["date"], r["forecaster"]): r
        for r in conn.execute("SELECT * FROM scores WHERE question_id = ?", (q["id"],))
    }
    spreads = {
        (r["date"], r["forecaster"]): r
        for r in conn.execute(
            "SELECT date, forecaster, p10, p90 FROM forecasts WHERE question_id = ?", (q["id"],)
        )
    }

    days: dict[str, QuestionDay] = {}
    dates = [r[0] for r in conn.execute("SELECT date FROM ledger_days ORDER BY date")]
    for date in dates:
        mine = [
            leaf
            for leaf in ledger.entries(conn, date)
            if leaf["entry"]["kind"] == "forecast" and leaf["entry"]["question_id"] == q["id"]
        ]
        if not mine:
            continue
        titles = forecast.headlines(conn, date, q["countries"])
        forecasts = {}
        for leaf in mine:
            e, who = leaf["entry"], leaf["entry"]["forecaster"]
            s, spread = scores.get((date, who)), spreads[(date, who)]
            forecasts[who] = QuestionForecast(
                probability=float(e["probability"]),
                p10=spread["p10"],
                p90=spread["p90"],
                brier=s["brier"] if s else None,
                log_score=s["log_score"] if s else None,
                leaf_hash=leaf["leaf_hash"],
                salt=leaf["salt"],
                committed_at=e["committed_at"],
                model=e["model"],
                market_price_at_commit=float(e["market_price_at_commit"]),
            )
        days[date] = QuestionDay(
            date=date,
            snapshot_sha256=mine[0]["entry"]["snapshot_sha256"],
            forecasts=forecasts,
            segments=_segments(conn, titles, q["text"]),
            plain_samples=_plain_samples(conn, titles, q["text"]),
            headlines=titles,
        )

    latest = conn.execute(
        "SELECT provider, model FROM llm_calls WHERE purpose = 'forecast_sim' ORDER BY id DESC"
        " LIMIT 1"
    ).fetchone()
    protocol = score.load_protocol()
    return QuestionPage(
        question=QuestionInfo(
            **{k: q[k] for k in ("id", "text", "topic", "opens", "closes", "resolves_by")},
            resolution_source=q["resolution_source"],
            tie_break=q["tie_break"],
            market_source=q["market_source"],
            topic_label=topic_labels[q["topic"]],
            countries=[
                QuestionCountry(iso3=c, name=names[c], tier=tiers[c]) for c in q["countries"]
            ],
            question_hash=forecast.question_hash(q),
            question_set_hash=set_hash,
            daily_on=q.get("daily_on") or None,
        ),
        outcome=None if res is None else QuestionOutcome(**dict(res)),
        members=settings.DAILY_FORECAST_MEMBERS,
        plain_llm_samples=settings.PLAIN_LLM_SAMPLES,
        log_clip=list(protocol["log_clip"]),
        min_resolved=protocol["min_resolved_for_claims"],
        model=latest["model"] if latest else None,
        provider=latest["provider"] if latest else None,
        days=list(days.values()),
    )

"""GET /v1/cycle: one daily cycle as a run log, and its replay from recorded model outputs.

Contract: product/world.md. Every value is read from stage_runs, llm_calls, the news and signal
tables, the snapshots, nudges, audits and the ledger; nothing here is computed for display only.
"""

import csv
import json
import sqlite3
from datetime import datetime
from typing import Any, Literal

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from rw import daily, db, forecast, ledger, llm, news, population, replay, settings

router = APIRouter()
TOP_ITEMS = 3


class Step(BaseModel):
    step: str
    status: Literal["ok", "failed", "running", "not_run"]
    started_at: str | None
    finished_at: str | None
    seconds: float | None
    detail: dict[str, Any] | None
    model_calls: int
    in_tokens: int
    out_tokens: int
    cost_usd: float
    by_purpose: dict[str, int]


class TopItem(BaseModel):
    title: str
    iso3: str
    tier: str
    salience: float
    value: float


class TopicNews(BaseModel):
    topic: str
    label: str
    signals: int
    mean_value: float | None
    top: list[TopItem]


class News(BaseModel):
    source: Literal["fixtures", "gdelt"] | None
    articles: int | None
    clusters: int
    countries: int
    by_topic: list[TopicNews]


class Assimilation(BaseModel):
    iso3: str
    topic: str
    before: float | None
    after_news: float
    observed: float | None
    observed_n: int | None
    observed_source: str | None
    innovation: float | None
    applied: float | None
    gain: float | None
    after: float


class Audit(BaseModel):
    iso3: str
    topic: str
    sim_sd: float
    survey_sd: float
    ratio: float
    in_band: bool


class CycleLedger(BaseModel):
    root: str
    leaf_count: int
    record_hash: str
    anchor: ledger.AnchorStatus
    anchored_at: str | None


class Budget(BaseModel):
    nightly_budget_usd: float
    spent_usd: float


class SettingsUsed(BaseModel):
    assimilation: str
    kalman_walk_sd_logit: float
    kalman_prior_sd_logit: float
    poll_error_factor: float
    step_cap_logit: float
    anchor_pull: float
    spread_band: list[float]
    daily_forecast_members: int
    plain_llm_samples: int
    headlines_per_question: int


class Cycle(BaseModel):
    date: str
    dates: list[str]
    model: str
    provider: str
    engine_version: str
    config_hash: str
    steps: list[Step]
    news: News
    assimilation: list[Assimilation]
    audit: list[Audit]
    experimental: list[str]
    ledger: CycleLedger | None
    budget: Budget
    settings_used: SettingsUsed


class ReplayRow(BaseModel):
    question_id: str
    question: str | None
    forecaster: Literal["sim", "plain_llm"]
    committed: float
    replayed: float | None
    low: float | None
    high: float | None
    diff: float | None
    matches: bool


class Replay(BaseModel):
    date: str
    forecasts: list[ReplayRow]
    calls_used: int
    missing: list[str]


def _seconds(start: str | None, end: str | None) -> float | None:
    if not (start and end):
        return None
    return round((datetime.fromisoformat(end) - datetime.fromisoformat(start)).total_seconds(), 3)


def _steps(conn: sqlite3.Connection, date: str) -> list[Step]:
    stored = {
        r["step"]: r for r in conn.execute("SELECT * FROM stage_runs WHERE date = ?", (date,))
    }
    windows = [(s, r["started_at"], r["finished_at"] or "9999") for s, r in stored.items()]
    lo = min((w[1] for w in windows), default="")
    calls = conn.execute(
        "SELECT at, purpose, in_tokens, out_tokens, cost_usd FROM llm_calls WHERE at >= ?"
        " ORDER BY id",
        (lo,),
    ).fetchall()
    # A call at the instant one step ends and the next begins belongs to the later step.
    totals: dict[str, list[Any]] = {s: [0, 0, 0, 0.0, {}] for s in stored}
    for c in calls:
        owner = [s for s, a, b in windows if a <= c["at"] <= b]
        if not owner:
            continue
        t = totals[max(owner, key=lambda s: stored[s]["started_at"])]
        t[0] += 1
        t[1] += c["in_tokens"]
        t[2] += c["out_tokens"]
        t[3] += c["cost_usd"]
        t[4][c["purpose"]] = t[4].get(c["purpose"], 0) + 1
    out = []
    for step in daily.STEPS:
        r = stored.get(step)
        n, tin, tout, cost, by = totals.get(step, [0, 0, 0, 0.0, {}])
        out.append(
            Step(
                step=step,
                status=r["status"] if r else "not_run",
                started_at=r["started_at"] if r else None,
                finished_at=r["finished_at"] if r else None,
                seconds=_seconds(r["started_at"], r["finished_at"]) if r else None,
                detail=json.loads(r["detail"]) if r and r["detail"] else None,
                model_calls=n,
                in_tokens=tin,
                out_tokens=tout,
                cost_usd=cost,
                by_purpose=by,
            )
        )
    return out


def _articles(date: str, source: str | None) -> int | None:
    path = (
        news.live_news_path(date)
        if source == "gdelt"
        else forecast.FIXTURES / "news" / f"{date}.csv"
    )
    if not path.exists():
        return None
    with path.open(newline="") as f:
        return sum(1 for _ in csv.DictReader(f))


def _news(conn: sqlite3.Connection, date: str, steps: list[Step]) -> News:
    detail = next(s.detail for s in steps if s.step == "ingest") or {}
    source = detail.get("news")
    tiers = {c["iso3"]: population.coverage_tier(c) for c in population.countries()}
    rows = conn.execute(
        "SELECT cluster_id, iso3, title, salience, topic, value FROM signals WHERE date = ?",
        (date,),
    ).fetchall()
    by_topic = []
    for topic, label in (
        (r["topic"], r["label"]) for r in population._read(population.DATA / "topics.csv")
    ):
        pushes = [r for r in rows if r["topic"] == topic and r["value"] != 0]
        top = sorted(pushes, key=lambda r: (-r["salience"] * abs(r["value"]), r["cluster_id"]))
        by_topic.append(
            TopicNews(
                topic=topic,
                label=label,
                signals=len(pushes),
                mean_value=float(np.mean([r["value"] for r in pushes])) if pushes else None,
                top=[
                    TopItem(
                        title=r["title"],
                        iso3=r["iso3"],
                        tier=tiers[r["iso3"]],
                        salience=r["salience"],
                        value=r["value"],
                    )
                    for r in top[:TOP_ITEMS]
                ],
            )
        )
    return News(
        source=source,
        articles=_articles(date, source),
        clusters=len({r["cluster_id"] for r in rows}),
        countries=len({r["iso3"] for r in rows}),
        by_topic=by_topic,
    )


def _shares(agents: population.Agents, topic: str, mask: np.ndarray, shift: float = 0.0) -> float:
    return round(float((1 / (1 + np.exp(-(agents[f"b_{topic}"][mask] - shift)))).mean()), 4)


def _assimilation(conn: sqlite3.Connection, date: str) -> list[Assimilation]:
    if not population.snapshot_path(date).exists():
        return []
    after = population.read_snapshot(date)
    prev_date = daily.previous_snapshot(date)
    before = population.read_snapshot(prev_date) if prev_date else None
    nudges = {
        (r["iso3"], r["topic"]): r
        for r in conn.execute("SELECT * FROM nudges WHERE date = ?", (date,))
    }
    polls = {
        (r["iso3"], r["topic"]): r
        for r in conn.execute(
            "SELECT iso3, topic, SUM(share * n) / SUM(n) AS share, SUM(n) AS n,"
            " group_concat(source_id) AS source FROM observations WHERE date = ?"
            " GROUP BY iso3, topic",
            (date,),
        )
    }
    rows = []
    for c in population.countries():
        now = after["country"] == c["iso3"]
        was = None if before is None else before["country"] == c["iso3"]
        if not now.any():
            continue
        for topic in population.topics():
            nudge = nudges.get((c["iso3"], topic))
            poll = polls.get((c["iso3"], topic))
            rows.append(
                Assimilation(
                    iso3=c["iso3"],
                    topic=topic,
                    before=None
                    if before is None or was is None or not was.any()
                    else _shares(before, topic, was),
                    after_news=_shares(after, topic, now, nudge["applied"] if nudge else 0.0),
                    observed=None if poll is None else round(poll["share"], 4),
                    observed_n=None if poll is None else int(poll["n"]),
                    observed_source=None if poll is None else poll["source"],
                    innovation=None if nudge is None else nudge["wanted"],
                    applied=None if nudge is None else nudge["applied"],
                    gain=nudge["applied"] / nudge["wanted"] if nudge and nudge["wanted"] else None,
                    after=_shares(after, topic, now),
                )
            )
    return rows


def _provider(conn: sqlite3.Connection, date: str, steps: list[Step]) -> tuple[str, str]:
    """(provider, model) the day's calls were answered by: from its first recorded call, else its
    first committed forecast, else the engine's current provider."""
    first = next((s for s in steps if s.model_calls), None)
    if first is not None:
        row = conn.execute(
            "SELECT provider, model FROM llm_calls WHERE at >= ? AND at <= ? ORDER BY id LIMIT 1",
            (first.started_at, first.finished_at or "9999"),
        ).fetchone()
        if row is not None:
            return row["provider"], "fake" if row["provider"] == "fake" else row["model"]
    row = conn.execute(
        "SELECT model FROM forecasts WHERE date = ? AND model IS NOT NULL LIMIT 1", (date,)
    ).fetchone()
    name = row["model"] if row else llm.model_name()
    return llm.provider_for(name), name


def _cycle(conn: sqlite3.Connection, date: str) -> Cycle:
    dates = [r[0] for r in conn.execute("SELECT DISTINCT date FROM stage_runs ORDER BY date")]
    steps = _steps(conn, date)
    provider, model = _provider(conn, date, steps)
    day = ledger._day_row(conn, date)
    anchor, at = ledger.anchor_status(conn, date)
    return Cycle(
        date=date,
        dates=dates,
        model=model,
        provider=provider,
        engine_version=settings.ENGINE_VERSION,
        config_hash=daily.config_hash(),
        steps=steps,
        news=_news(conn, date, steps),
        assimilation=_assimilation(conn, date),
        audit=[
            Audit(**{**dict(r), "in_band": bool(r["in_band"])})
            for r in conn.execute(
                "SELECT iso3, topic, sim_sd, survey_sd, ratio, in_band FROM audits WHERE date = ?"
                " ORDER BY iso3, topic",
                (date,),
            )
        ],
        experimental=[
            r[0]
            for r in conn.execute(
                "SELECT iso3 FROM country_status WHERE date = ? AND experimental = 1 ORDER BY iso3",
                (date,),
            )
        ],
        ledger=None
        if day is None
        else CycleLedger(
            root=day["root"],
            leaf_count=day["leaf_count"],
            record_hash=day["record_hash"],
            anchor=anchor,
            anchored_at=at,
        ),
        budget=Budget(
            nightly_budget_usd=settings.NIGHTLY_BUDGET_USD,
            spent_usd=sum(s.cost_usd for s in steps),
        ),
        settings_used=SettingsUsed(
            assimilation=settings.ASSIMILATION,
            kalman_walk_sd_logit=settings.KALMAN_WALK_SD_LOGIT,
            kalman_prior_sd_logit=settings.KALMAN_PRIOR_SD_LOGIT,
            poll_error_factor=settings.POLL_ERROR_FACTOR,
            step_cap_logit=settings.STEP_CAP_LOGIT,
            anchor_pull=settings.ANCHOR_PULL,
            spread_band=list(settings.SPREAD_BAND),
            daily_forecast_members=settings.DAILY_FORECAST_MEMBERS,
            plain_llm_samples=settings.PLAIN_LLM_SAMPLES,
            headlines_per_question=settings.HEADLINES_PER_QUESTION,
        ),
    )


@router.get(
    "/v1/cycle",
    summary="One daily cycle as a run log: steps, model calls, news, assimilation, spread audit",
    response_model=Cycle,
)
def latest_cycle() -> Cycle:
    conn = db.connect()
    latest = conn.execute("SELECT max(date) FROM stage_runs").fetchone()[0]
    if latest is None:
        raise HTTPException(404, "no cycle has run yet")
    return _cycle(conn, latest)


@router.get(
    "/v1/cycle/{date}",
    summary="One daily cycle as a run log: steps, model calls, news, assimilation, spread audit",
    response_model=Cycle,
)
def cycle(date: str) -> Cycle:
    conn = db.connect()
    if conn.execute("SELECT 1 FROM stage_runs WHERE date = ?", (date,)).fetchone() is None:
        raise HTTPException(404, f"no cycle for {date}")
    return _cycle(conn, date)


@router.get(
    "/v1/cycle/{date}/replay",
    summary=(
        "Replay the day's forecasts from the recorded model outputs"
        " and diff them against the committed values"
    ),
    response_model=Replay,
)
def cycle_replay(date: str) -> dict[str, Any]:
    conn = db.connect()
    if ledger._day_row(conn, date) is None or not population.snapshot_path(date).exists():
        raise HTTPException(404, f"no committed day with a world snapshot for {date}")
    return replay.replay_day(conn, date)

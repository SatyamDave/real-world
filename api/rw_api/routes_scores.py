"""GET /v1/scoreboard: every scored forecast, the scores that follow and how they were made."""

from collections import defaultdict
from statistics import fmean
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from rw import daily, forecast, ledger, population, score

router = APIRouter()
# `python -m rw_api.app` imports this module while app.py runs as __main__, and the line below then
# loads app.py a second time, which includes this module's router; the router must exist by then.
from rw_api.app import BaselineSkill  # noqa: E402

# Below this many resolved questions a forecaster's interval says nothing, so none is returned.
MIN_N_FOR_INTERVAL = 10
BINS = 10


class Bootstrap(BaseModel):
    block: str
    resamples: int
    seed: int
    interval: float


class Protocol(BaseModel):
    version: str
    hash: str
    headline: str
    log_clip: list[float]
    coin_reference: float
    min_resolved_for_claims: int
    bootstrap: Bootstrap


class ForecasterScore(BaseModel):
    forecaster: str
    n_questions: int
    n_forecasts: int
    mean_brier: float
    mean_log_score: float
    brier_low: float | None
    brier_high: float | None


class ReliabilityBin(BaseModel):
    bin_low: float
    bin_high: float
    n: int
    mean_probability: float
    observed_rate: float


class Scored(BaseModel):
    probability: float
    brier: float


class ResolvedQuestion(BaseModel):
    question_id: str
    text: str
    date: str
    outcome: int
    resolved_on: str
    tiers: list[str]
    region: str
    forecasts: dict[str, Scored]


class Miss(BaseModel):
    question_id: str
    text: str
    date: str
    forecaster: str
    probability: float
    outcome: int
    brier: float


class Scoreboard(BaseModel):
    protocol: Protocol
    resolved_questions: int
    open_questions: int
    first_commit: str | None
    forecasters: list[ForecasterScore]
    skill: dict[str, BaselineSkill]
    reliability: dict[str, list[ReliabilityBin]]
    resolved: list[ResolvedQuestion]
    misses: list[Miss]


def _rows(conn) -> tuple[list[dict[str, Any]], set[str]]:
    """The committed forecasts of resolved questions, built as `scores()` in app.py builds them.

    Adds the question text, every tier and the resolution date. Also returns the ids of the
    questions with a forecast and no resolution yet.
    """
    resolutions = {
        r[0]: (r[1], r[2])
        for r in conn.execute("SELECT question_id, outcome, resolved_on FROM resolutions")
    }
    questions = {q["id"]: q for q in forecast.load_questions()}
    countries = {c["iso3"]: c for c in population.countries()}
    rows, open_ids = [], set()
    for (day,) in conn.execute("SELECT date FROM ledger_days ORDER BY date").fetchall():
        for leaf in ledger.entries(conn, day):
            e = leaf["entry"]
            if e["kind"] != "forecast":
                continue
            if e["question_id"] not in resolutions:
                open_ids.add(e["question_id"])
                continue
            q = questions[e["question_id"]]
            cs = [countries[iso3] for iso3 in q["countries"]]
            regions = {c["region"] for c in cs}
            outcome, resolved_on = resolutions[e["question_id"]]
            rows.append(
                {
                    "date": e["date"],
                    "question_id": e["question_id"],
                    "text": q["text"],
                    "forecaster": e["forecaster"],
                    "probability": float(e["probability"]),
                    "outcome": outcome,
                    "resolved_on": resolved_on,
                    "tier": max(population.coverage_tier(c) for c in cs),
                    "tiers": sorted({population.coverage_tier(c) for c in cs}),
                    "region": regions.pop() if len(regions) == 1 else "multiple",
                }
            )
    return rows, open_ids


def _forecaster(name: str, rows: list[dict[str, Any]], protocol: dict[str, Any]) -> ForecasterScore:
    clip = protocol["log_clip"]
    by_day: dict[str, list[float]] = defaultdict(list)
    for r in rows:
        by_day[r["date"]].append(score.brier(r["probability"], r["outcome"]))
    n = len({r["question_id"] for r in rows})
    low = high = None
    if n >= MIN_N_FOR_INTERVAL:
        b = protocol["bootstrap"]
        low, high = score.block_bootstrap(by_day, b["resamples"], b["seed"], b["interval"])
    return ForecasterScore(
        forecaster=name,
        n_questions=n,
        n_forecasts=len(rows),
        mean_brier=fmean(v for vs in by_day.values() for v in vs),
        mean_log_score=fmean(score.log_score(r["probability"], r["outcome"], clip) for r in rows),
        brier_low=low,
        brier_high=high,
    )


def _reliability(rows: list[dict[str, Any]]) -> list[ReliabilityBin]:
    bins: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        bins[min(int(r["probability"] * BINS), BINS - 1)].append(r)
    return [
        ReliabilityBin(
            bin_low=i / BINS,
            bin_high=(i + 1) / BINS,
            n=len(rs),
            mean_probability=fmean(r["probability"] for r in rs),
            observed_rate=fmean(r["outcome"] for r in rs),
        )
        for i, rs in sorted(bins.items())
    ]


@router.get(
    "/v1/scoreboard",
    summary=(
        "The scoreboard: Brier per forecaster, skill against each baseline, reliability bins"
        " and every resolved question"
    ),
    response_model=Scoreboard,
)
def scoreboard() -> Scoreboard:
    from rw_api.app import connect  # app imports this module, so the rest waits for a request

    conn = connect()
    protocol = score.load_protocol()
    rows, open_ids = _rows(conn)
    by_forecaster: dict[str, list[dict[str, Any]]] = defaultdict(list)
    days: dict[tuple[str, str], dict[str, Any]] = {}
    for r in rows:
        by_forecaster[r["forecaster"]].append(r)
        day = days.setdefault(
            (r["date"], r["question_id"]),
            {
                **{k: r[k] for k in ("question_id", "text", "date", "outcome", "resolved_on")},
                "tiers": r["tiers"],
                "region": r["region"],
                "forecasts": {},
            },
        )
        day["forecasts"][r["forecaster"]] = Scored(
            probability=r["probability"], brier=score.brier(r["probability"], r["outcome"])
        )
    sims = sorted(
        (r for r in by_forecaster["sim"]),
        key=lambda r: (-score.brier(r["probability"], r["outcome"]), r["date"], r["question_id"]),
    )
    first = conn.execute("SELECT min(date) FROM ledger_days").fetchone()[0]
    return Scoreboard(
        protocol=Protocol(
            **{k: protocol[k] for k in Protocol.model_fields if k != "hash"},
            hash=score.protocol_hash(),
        ),
        resolved_questions=len({r["question_id"] for r in rows}),
        open_questions=len(open_ids),
        first_commit=first,
        forecasters=[_forecaster(f, rs, protocol) for f, rs in sorted(by_forecaster.items())],
        skill={
            k: BaselineSkill.model_validate(v) for k, v in score.summarize(rows, protocol).items()
        },
        reliability={f: _reliability(rs) for f, rs in sorted(by_forecaster.items())},
        resolved=[ResolvedQuestion(**d) for _, d in sorted(days.items(), reverse=True)],
        misses=[
            Miss(
                **{
                    k: r[k]
                    for k in ("question_id", "text", "date", "forecaster", "probability", "outcome")
                },
                brier=score.brier(r["probability"], r["outcome"]),
            )
            for r in sims[: daily.BIGGEST_MISSES]
        ],
    )

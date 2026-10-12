"""GET /v1/world/population: the simulated population with its calibration and spread.

Contract: product/world-page.md. Reads the latest snapshot, never writes an engine table.
"""

from collections import Counter

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from rw import population, settings, sources

router = APIRouter()


QUANTILES = (10, 50, 90)


class Rubric(BaseModel):
    population: int
    attitudes: int
    markets: int
    news: int
    ground_truth: int
    score: int


class PopulationSegment(BaseModel):
    segment: str
    age_band: str
    education: str
    agent_count: int


class PopulationTopic(BaseModel):
    topic: str
    label: str
    source_id: str
    calibrated_share: float
    survey_sd_logit: float
    share: float
    p10: float
    p50: float
    p90: float
    sim_sd_logit: float | None
    ratio: float | None
    in_band: bool | None


class PopulationCountry(BaseModel):
    iso3: str
    name: str
    region: str
    population_millions: float
    tier: str
    experimental: bool
    rubric: Rubric
    agent_count: int
    segments: list[PopulationSegment]
    topics: list[PopulationTopic]


class PopulationSource(BaseModel):
    source_id: str
    kind: str
    commercial_use: str
    checked_on: str


class SettingsUsed(BaseModel):
    world_agents: int
    world_seed: int
    spread_band: list[float]
    country_floor_share: float
    stubbornness_beta: list[float]
    offset_sd_logit: float


class Population(BaseModel):
    date: str
    agents: int
    segments: int
    tier_floors: dict[str, int]
    settings_used: SettingsUsed
    countries: list[PopulationCountry]
    sources: list[PopulationSource]


@router.get(
    "/v1/world/population",
    summary=(
        "The simulated population: every country, segment and topic with its calibration and spread"
    ),
    response_model=Population,
    responses={404: {"description": "No such world snapshot"}},
)
def world_population() -> Population:
    day = population.latest_snapshot_date()
    if day is None:
        raise HTTPException(404, "no world snapshot committed yet")
    agents = population.read_snapshot(day)
    licence = sources.require(population.SOURCE_ID)
    from rw_api.app import connect  # app imports this module, so the import waits for a request

    conn = connect()
    experimental = dict(
        conn.execute("SELECT iso3, experimental FROM country_status WHERE date = ?", (day,))
    )
    audits = {
        (r["iso3"], r["topic"]): r
        for r in conn.execute("SELECT * FROM audits WHERE date = ?", (day,))
    }
    attitudes = {
        (r["iso3"], r["topic"]): r for r in population._read(population.SAMPLE / "attitudes.csv")
    }
    labels = {r["topic"]: r["label"] for r in population._read(population.DATA / "topics.csv")}

    countries = []
    for c in population.countries():
        mask = agents["country"] == c["iso3"]
        if not mask.any():
            continue
        cells = Counter(zip(agents["age_band"][mask], agents["education"][mask], strict=True))
        topics = []
        for t in population.topics():
            share = 1 / (1 + np.exp(-agents[f"b_{t}"][mask]))
            p10, p50, p90 = (float(np.percentile(share, q)) for q in QUANTILES)
            a, audit = attitudes[(c["iso3"], t)], audits.get((c["iso3"], t))
            topics.append(
                PopulationTopic(
                    topic=t,
                    label=labels[t],
                    source_id=population.SOURCE_ID,
                    calibrated_share=float(a["mean_share"]),
                    survey_sd_logit=float(a["survey_sd_logit"]),
                    share=float(share.mean()),
                    p10=p10,
                    p50=p50,
                    p90=p90,
                    sim_sd_logit=audit["sim_sd"] if audit else None,
                    ratio=audit["ratio"] if audit else None,
                    in_band=bool(audit["in_band"]) if audit else None,
                )
            )
        countries.append(
            PopulationCountry(
                iso3=c["iso3"],
                name=c["name"],
                region=c["region"],
                population_millions=float(c["population_millions"]),
                tier=population.coverage_tier(c),
                experimental=bool(experimental.get(c["iso3"], False)),
                rubric=Rubric(
                    **{p: int(c[p]) for p in population.RUBRIC},
                    score=sum(int(c[p]) for p in population.RUBRIC),
                ),
                agent_count=int(mask.sum()),
                segments=[
                    PopulationSegment(
                        segment=population.segment_key(
                            {"country": c["iso3"], "age_band": age, "education": edu}
                        ),
                        age_band=age,
                        education=edu,
                        agent_count=n,
                    )
                    for (age, edu), n in sorted(cells.items())
                ],
                topics=topics,
            )
        )
    return Population(
        date=day,
        agents=len(agents["agent_id"]),
        segments=len(set(agents["segment"].tolist())),
        tier_floors=dict(population.TIER_FLOORS),
        settings_used=SettingsUsed(
            world_agents=settings.WORLD_AGENTS,
            world_seed=settings.WORLD_SEED,
            spread_band=list(settings.SPREAD_BAND),
            country_floor_share=population.COUNTRY_FLOOR_SHARE,
            stubbornness_beta=list(population.STUBBORNNESS_BETA),
            offset_sd_logit=population.OFFSET_SD_LOGIT,
        ),
        countries=countries,
        sources=[
            PopulationSource(
                source_id=licence["source_id"],
                kind=licence["kind"],
                commercial_use=licence["commercial_use"],
                checked_on=licence["checked_on"],
            )
        ],
    )

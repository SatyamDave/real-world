"""Forks: apply one event to a snapshot for N days across K ensemble members and return a typed
result. The Pydantic models here are the contract the API, SDKs and web app use."""

import hashlib
import json
import math
import sqlite3
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from rw import beliefs, llm, news, population, settings

# These belong in settings.py, which this slice may not touch.
FORK_AGENTS_MIN = 50
# Signal noise per member, in signal units, by coverage tier: thinner data, wider spread.
TIER_NOISE_SD = {"A": 0.05, "B": 0.10, "C": 0.15, "D": 0.20}
# Upper bound on the characters news.extract_signal adds around the event and the audience: the
# Jev request with its questions measured 3,204 on 2026-10-12.
PROMPT_OVERHEAD_CHARS = 4000
TOP_SHIFTS = 3

DISCLOSURE = "AI-simulated. Not a poll or a prediction of a real person"
NOTE = "Counterfactual: not scored"

AGE_WORDS = {"18-34": "aged 18 to 34", "35-54": "aged 35 to 54", "55+": "aged 55 and over"}


class Event(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=settings.EVENT_TEXT_MAX_CHARS)
    countries: list[str] | None = None

    @field_validator("countries")
    @classmethod
    def _known_countries(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        unknown = set(v) - set(news.country_names())
        if unknown or not v:
            raise ValueError(f"countries must be a non-empty list of known ISO3 codes: {unknown}")
        return sorted(set(v))


class SimulateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    world: str = Field(
        default="today",
        pattern=r"^(today|\d{4}-\d{2}-\d{2})$",
        description="The snapshot to fork: today's world, or a committed day as YYYY-MM-DD.",
    )
    event: Event = Field(description="The one event to add, in plain words.")
    days: int = Field(
        default=settings.FORK_DAYS_DEFAULT,
        ge=1,
        le=settings.FORK_DAYS_MAX,
        description="Simulated days to run after the event.",
    )
    members: int = Field(
        default=settings.FORK_MEMBERS_DEFAULT,
        ge=1,
        le=settings.FORK_MEMBERS_MAX,
        description=(
            "Ensemble members: independent runs of the fork, each with its own agent subsample"
            " and noise. Their p10-p90 range is the spread."
        ),
    )
    agents: int = Field(
        default=settings.FORK_AGENTS_DEFAULT,
        ge=FORK_AGENTS_MIN,
        le=settings.FORK_AGENTS_MAX,
        description="Agents sampled from the world snapshot, in proportion to country population.",
    )
    topics: list[str] | None = Field(
        default=None, description="Topics to report; null means every topic the world tracks."
    )
    max_cost_usd: float = Field(
        default=settings.FORK_MAX_COST_USD_DEFAULT,
        gt=0,
        le=settings.FORK_MAX_COST_USD_LIMIT,
        description=(
            "Cost cap in dollars. A fork whose estimate is above it is refused with 402. The"
            " estimate counts one model call per segment."
        ),
    )
    seed: int = Field(
        default=0,
        ge=0,
        description=(
            "Fixes the agent subsample and each member's noise. The model's answers can still"
            " differ between runs."
        ),
    )

    @field_validator("topics")
    @classmethod
    def _known_topics(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        unknown = set(v) - set(news.topics())
        if unknown or not v:
            raise ValueError(f"topics must be a non-empty list of known topics: {unknown}")
        return [t for t in news.topics() if t in v]


class Estimate(BaseModel):
    estimated_cost_usd: float
    model_calls: int
    segments: int
    within_cap: bool


class Band(BaseModel):
    p10: float
    p50: float
    p90: float


class DayBand(Band):
    day: int


class TopicOutput(BaseModel):
    baseline_share: float
    final: Band
    by_day: list[DayBand]


class SegmentShift(BaseModel):
    segment: str
    topic: str
    shift_p10: float
    shift_p50: float
    shift_p90: float
    n_agents: int
    tier: str


Cause = Literal["event", "anchor_pull"]


class Step(BaseModel):
    day: int
    topic: str
    delta: float
    cause: Cause


class TraceAgent(BaseModel):
    agent_id: str
    iso3: str
    segment: str
    belief_start: dict[str, float]
    belief_end: dict[str, float]
    steps: list[Step]


class Trace(BaseModel):
    segment_signals: dict[str, dict[str, float]]
    agents: list[TraceAgent]


class Cost(BaseModel):
    estimated_usd: float = Field(
        description="An estimate made before the run, at the configured model's prices."
    )
    actual_usd: float = Field(description="Dollars the provider charged; 0 with the fake model.")


class Coverage(BaseModel):
    iso3: str
    tier: str


class SimulateResult(BaseModel):
    simulated: Literal[True] = True
    disclosure: str = DISCLOSURE
    world_snapshot_id: str
    engine_version: str
    model: str
    provider: str = Field(
        description='Who answered the model calls: "jev", or "fake" when no model ran.'
    )
    seed: int
    members: int
    agents_sampled: int
    days: int
    cost: Cost
    coverage: list[Coverage]
    outputs: dict[str, TopicOutput]
    segments: list[SegmentShift]
    top_shifts: list[SegmentShift] = Field(
        description="The largest median shifts among segments of at least top_shift_min_agents."
    )
    top_shift_min_agents: int
    trace: Trace
    note: Literal["Counterfactual: not scored"] = NOTE
    content_hash: str = ""


Agents = population.Agents


def _r(x: float) -> float:
    return round(float(x), 6)


def describe(segment: str) -> str:
    iso3, age_band, education = segment.split("|")
    return (
        f"adults {AGE_WORDS[age_band]} in {news.country_names()[iso3]}"
        f" with a {education} level of formal education"
    )


def _snapshot_id(req: SimulateRequest) -> str:
    snapshot_id = population.latest_snapshot_date() if req.world == "today" else req.world
    if snapshot_id is None or not population.snapshot_path(snapshot_id).exists():
        raise ValueError(f"no world snapshot for {req.world!r}")
    return snapshot_id


def _subsample(req: SimulateRequest, world: Agents) -> Agents:
    """Up to req.agents agents, allocated across countries in proportion to the snapshot."""
    pool = np.arange(len(world["agent_id"]))
    if req.event.countries is not None:
        pool = pool[np.isin(world["country"][pool], req.event.countries)]
    if pool.size == 0:
        raise ValueError("the snapshot has no agents in the event's countries")
    isos, sizes = np.unique(world["country"][pool], return_counts=True)
    counts = population.allocate(min(req.agents, pool.size), sizes / sizes.sum())
    rng = np.random.default_rng([req.seed, 0])
    picked = [
        rng.choice(pool[world["country"][pool] == iso], size=k, replace=False)
        for iso, k in zip(isos, counts, strict=True)
    ]
    idx = np.sort(np.concatenate(picked))
    return {name: values[idx] for name, values in world.items()}


def _estimate(req: SimulateRequest, sub: Agents) -> Estimate:
    segments = sorted(set(sub["segment"].tolist()))
    cost = sum(
        llm.estimate_decide_cost(len(req.event.text) + len(describe(s)) + PROMPT_OVERHEAD_CHARS)
        for s in segments
    )
    return Estimate(
        estimated_cost_usd=cost,
        model_calls=len(segments),
        segments=len(segments),
        within_cap=cost <= req.max_cost_usd,
    )


def estimate(req: SimulateRequest) -> Estimate:
    snapshot_id = _snapshot_id(req)
    return _estimate(req, _subsample(req, population.read_snapshot(snapshot_id)))


def input_hash(snapshot_id: str, req: SimulateRequest) -> str:
    key = {
        "snapshot_id": snapshot_id,
        "event": req.event.model_dump(),
        "days": req.days,
        "members": req.members,
        "agents": req.agents,
        "seed": req.seed,
        "topics": req.topics or list(news.topics()),
        "engine_version": settings.ENGINE_VERSION,
        "model": llm.model_name(),
    }
    return hashlib.sha256(json.dumps(key, sort_keys=True).encode()).hexdigest()


def content_hash(result: SimulateResult) -> str:
    body = result.model_dump(mode="json", exclude={"content_hash"})
    return hashlib.sha256(
        json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def share(B: np.ndarray) -> np.ndarray:
    """Expected share answering yes per topic: the mean of each agent's yes probability."""
    return (1 / (1 + np.exp(-B))).mean(axis=0)


def _band(values: np.ndarray) -> list[float]:
    """p10, p50, p90 across members, with p10 and p90 widened to the widest band any leading
    subset of members gives. Member m's draws do not depend on how many members run, so adding
    members never narrows the band. Raw ensemble spread runs narrow anyway
    (research/engineering/066).
    """
    prefix = np.array([np.percentile(values[:k], [10, 90]) for k in range(1, len(values) + 1)])
    return [_r(prefix[:, 0].min()), _r(np.median(values)), _r(prefix[:, 1].max())]


def run(
    conn: sqlite3.Connection,
    req: SimulateRequest,
    on_progress: Callable[[int, int], None] | None = None,
    budget: llm.Budget | None = None,
) -> SimulateResult:
    """Pass budget, limited to req.max_cost_usd, to read what the run spent, even if it raises."""
    snapshot_id = _snapshot_id(req)
    sub = _subsample(req, population.read_snapshot(snapshot_id))
    est = _estimate(req, sub)
    if not est.within_cap:
        raise llm.BudgetExceeded(
            f"estimate ${est.estimated_cost_usd:.6f} exceeds max_cost_usd ${req.max_cost_usd:.6f}"
        )

    key = input_hash(snapshot_id, req)
    row = conn.execute(
        "SELECT result_json FROM simulations WHERE input_hash = ?", (key,)
    ).fetchone()
    if row is not None:
        # A row stored under an older result shape is a miss: run again and replace it.
        try:
            return SimulateResult.model_validate_json(row[0])
        except ValidationError:
            pass

    topics = req.topics or list(news.topics())
    if budget is None:
        budget = llm.Budget(req.max_cost_usd)
    segments, seg_of = np.unique(sub["segment"], return_inverse=True)
    raw = [
        news.extract_signal(req.event.text, describe(s), budget, conn=conn, purpose="fork_signal")
        for s in segments
    ]
    seg_signal = np.array([[sig[t] for t in topics] for sig in raw])
    seg_salience = np.array([sig["salience"] for sig in raw])
    seg_tier = np.array([sub["tier"][seg_of == j][0] for j in range(len(segments))])
    seg_noise_sd = np.array([TIER_NOISE_SD[t] for t in seg_tier])

    B_all = np.column_stack([sub[f"b_{t}"] for t in topics])
    B0_all = np.column_stack([sub[f"b0_{t}"] + sub.get(f"c_{t}", 0.0) for t in topics])
    n, n_topics = B_all.shape
    by_day = np.zeros((req.members, req.days, n_topics))
    seg_shift = np.full((req.members, len(segments), n_topics), np.nan)
    trace_agents: list[TraceAgent] = []
    baseline = share(B_all)

    for m in range(req.members):
        rng = np.random.default_rng([req.seed, m + 1])
        idx = rng.integers(0, n, n)
        B, B0, s, seg = B_all[idx], B0_all[idx], sub["s"][idx], seg_of[idx]
        noise = rng.normal(0.0, seg_noise_sd[:, None], seg_signal.shape)
        signal = np.clip(seg_signal + noise, -1, 1)[seg]
        start = B.copy()

        traced: list[int] = []
        steps: dict[int, list[Step]] = {}
        if m == 0:
            _, first = np.unique(idx, return_index=True)
            pick = np.random.default_rng([req.seed, 0, 1]).choice(
                first, size=min(settings.TRACE_AGENTS, first.size), replace=False
            )
            traced = sorted(pick.tolist())
            steps = {i: [] for i in traced}

        for day in range(1, req.days + 1):
            exposed = news.exposure(
                sub["age_band"][idx], sub["country"][idx], seg_salience[seg], day - 1, rng
            )
            anchor = settings.ANCHOR_PULL * (B0 - B)
            new = beliefs.update_beliefs(B, B0, s, signal, exposed)
            for i in traced:
                for j, t in enumerate(topics):
                    event_delta = new[i, j] - B[i, j] - anchor[i, j]
                    parts: list[tuple[float, Cause]] = [
                        (event_delta, "event"),
                        (anchor[i, j], "anchor_pull"),
                    ]
                    for delta, cause in parts:
                        if _r(delta) != 0:
                            steps[i].append(Step(day=day, topic=t, delta=_r(delta), cause=cause))
            B = new
            # Each member's change is laid on the shared baseline so resampling the start does not
            # read as an effect of the event.
            by_day[m, day - 1] = baseline + share(B) - share(start)
            if on_progress is not None:
                on_progress(m, day)

        for j in np.unique(seg):
            mask = seg == j
            seg_shift[m, j] = share(B[mask]) - share(start[mask])
        for i in traced:
            trace_agents.append(
                TraceAgent(
                    agent_id=str(sub["agent_id"][idx[i]]),
                    iso3=str(sub["country"][idx[i]]),
                    segment=str(sub["segment"][idx[i]]),
                    belief_start={t: _r(start[i, j]) for j, t in enumerate(topics)},
                    belief_end={t: _r(B[i, j]) for j, t in enumerate(topics)},
                    steps=steps[i],
                )
            )

    outputs = {}
    for j, t in enumerate(topics):
        days_out = []
        for d in range(req.days):
            p10, p50, p90 = _band(by_day[:, d, j])
            days_out.append(DayBand(day=d + 1, p10=p10, p50=p50, p90=p90))
        final = days_out[-1]
        outputs[t] = TopicOutput(
            baseline_share=_r(baseline[j]),
            final=Band(p10=final.p10, p50=final.p50, p90=final.p90),
            by_day=days_out,
        )

    shifts = []
    n_in_seg = np.bincount(seg_of, minlength=len(segments))
    for j, name in enumerate(segments):
        for k, t in enumerate(topics):
            present = seg_shift[:, j, k][~np.isnan(seg_shift[:, j, k])]
            if present.size == 0:
                continue
            p10, p50, p90 = _band(present)
            shifts.append(
                SegmentShift(
                    segment=str(name),
                    topic=t,
                    shift_p10=p10,
                    shift_p50=p50,
                    shift_p90=p90,
                    n_agents=int(n_in_seg[j]),
                    tier=str(seg_tier[j]),
                )
            )

    countries = np.unique(sub["country"])
    floor = math.ceil(settings.TOP_SHIFT_MIN_SHARE * n)
    big = [s for s in shifts if s.n_agents >= floor]
    provider = llm.decider().name
    result = SimulateResult(
        world_snapshot_id=snapshot_id,
        engine_version=settings.ENGINE_VERSION,
        model=llm.model_name(),
        provider=provider,
        seed=req.seed,
        members=req.members,
        agents_sampled=n,
        days=req.days,
        cost=Cost(
            estimated_usd=_r(est.estimated_cost_usd),
            actual_usd=0.0 if provider == "fake" else _r(budget.spent_usd),
        ),
        coverage=[
            Coverage(iso3=str(c), tier=str(sub["tier"][sub["country"] == c][0])) for c in countries
        ],
        outputs=outputs,
        segments=shifts,
        top_shifts=sorted(big, key=lambda x: -abs(x.shift_p50))[:TOP_SHIFTS],
        top_shift_min_agents=floor,
        trace=Trace(
            segment_signals={
                str(name): {t: _r(seg_signal[j, k]) for k, t in enumerate(topics)}
                for j, name in enumerate(segments)
            },
            agents=trace_agents,
        ),
    )
    result = result.model_copy(update={"content_hash": content_hash(result)})
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO simulations (input_hash, created_at, result_json)"
            " VALUES (?, ?, ?)",
            (key, datetime.now(UTC).isoformat(timespec="seconds"), result.model_dump_json()),
        )
    return result

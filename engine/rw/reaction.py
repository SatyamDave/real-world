"""Post tests: how a chosen audience reacts to one post (product/will-it-land.md).

One decision call per segment of the audience asks what a member would do on seeing the post;
segments are weighted by their agent count in today's world snapshot. Two short accounts and one
rewrite come from the open text model."""

import random
import sqlite3
from typing import Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field, field_validator

from rw import llm, news, population, settings, simulate

AgeBand = Literal["18-34", "35-54", "55+"]
Gut = Literal["lands", "flops"]
Outcome = Literal["landed", "flopped"]

# Option text the model reads, and the key each reads as in the result.
REACTIONS = {
    "scroll past it": "scroll_past",
    "read it and move on": "read",
    "like it": "like",
    "share it": "share",
}
SIDE = 3

VOICE_SCHEMA = {
    "type": "object",
    "properties": {"text": {"type": "string", "maxLength": 240}},
    "required": ["text"],
}


class Audience(BaseModel):
    model_config = ConfigDict(extra="forbid")
    countries: list[str] | None = Field(
        default=None, description="ISO3 codes; null means every simulated country."
    )
    age_bands: list[AgeBand] | None = Field(default=None, description="Null means every age.")

    @field_validator("countries")
    @classmethod
    def _known(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        unknown = set(v) - set(news.country_names())
        if unknown or not v:
            raise ValueError(f"countries must be a non-empty list of known ISO3 codes: {unknown}")
        return sorted(set(v))


class PostTestRequest(Audience):
    text: str = Field(min_length=1, max_length=settings.EVENT_TEXT_MAX_CHARS)
    gut: Gut | None = Field(default=None, description="The person's own call before the result.")


class PastPost(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1, max_length=settings.EVENT_TEXT_MAX_CHARS)
    outcome: Outcome


class RetroRequest(Audience):
    posts: list[PastPost] = Field(min_length=1, max_length=settings.TEST_RETRO_POSTS_MAX)


class Mix(BaseModel):
    scroll_past: float
    read: float
    like: float
    share: float


class SegmentReaction(BaseModel):
    segment: str
    label: str = Field(description="The segment in words.")
    country: str
    coverage_tier: str
    weight: float = Field(description="Share of the audience's agents in this segment.")
    landing: float = Field(description="Share who would like or share it.")


class Voice(BaseModel):
    label: str
    text: str
    simulated: Literal["Simulated account"] = "Simulated account"


class PostTestResult(BaseModel):
    landing_chance: float = Field(description="Audience share who would like or share it.")
    band: list[float] = Field(description="p10 and p90 of landing across segments.")
    mix: Mix
    best: list[SegmentReaction]
    worst: list[SegmentReaction]
    voices: list[Voice]
    rewrite: str
    segments: int
    model_calls: int
    cost_usd: float
    provider: str
    calibration: str = "Uncalibrated until 100 marked tests"
    disclosure: str = simulate.DISCLOSURE


class RetroPost(BaseModel):
    text: str
    outcome: Outcome
    landing_chance: float
    hit: bool


class RetroResult(BaseModel):
    posts: list[RetroPost]
    hits: int
    brier: float
    label: Literal["Retrospective: not on your record"] = "Retrospective: not on your record"
    disclosure: str = simulate.DISCLOSURE


def _tiers() -> dict[str, str]:
    return {r["iso3"]: population.coverage_tier(r) for r in population.countries()}


def audience_segments(aud: Audience) -> list[tuple[str, float]]:
    """(segment, weight) for the TEST_SEGMENTS most populous segments of the audience in the
    latest snapshot, weights summing to 1."""
    day = population.latest_snapshot_date()
    if day is None:
        raise ValueError("no world snapshot yet")
    world = population.read_snapshot(day)
    keep = np.ones(len(world["segment"]), dtype=bool)
    if aud.countries is not None:
        keep &= np.isin(world["country"], aud.countries)
    if aud.age_bands is not None:
        keep &= np.isin(world["age_band"], aud.age_bands)
    segs, counts = np.unique(world["segment"][keep], return_counts=True)
    if segs.size == 0:
        raise ValueError("the snapshot has no agents in that audience")
    top = np.argsort(-counts, kind="stable")[: settings.TEST_SEGMENTS]
    total = counts[top].sum()
    return [(str(segs[i]), float(counts[i] / total)) for i in top]


def _questions(segment: str, text: str) -> llm.Questions:
    options = list(REACTIONS)
    random.Random(f"{segment}|{text}").shuffle(options)
    return {
        "reaction": {
            "type": "choice",
            "instructions": "A randomly chosen member of this group sees the post in their feed."
            " What do they most likely do?",
            "criteria": dict.fromkeys(options),
        }
    }


def _state(segment: str, text: str) -> str:
    return f"People: {simulate.describe(segment)}\nPost:\n{text}"


def _voice_prompt(segment: str, text: str) -> str:
    return (
        f"You are one of these people: {simulate.describe(segment)}.\n"
        f"You see this post in your feed:\n{text}\n"
        "In one first-person sentence of at most 30 words, say how you react and why."
        ' Answer as JSON {"text": "..."}.'
    )


def _rewrite_prompt(text: str, best: str) -> str:
    return (
        f"Rewrite this post so that more people like or share it, especially {best}."
        f" Keep its meaning and stay under 280 characters.\nPost:\n{text}\n"
        'Answer as JSON {"text": "..."}.'
    )


def estimate(segments: list[tuple[str, float]], text: str, voices: int = 2) -> float:
    decide = sum(llm.estimate_decide_cost(len(_state(s, text)) + 400) for s, _ in segments)
    voice = voices * llm.estimate_cost(
        len(_voice_prompt(segments[0][0], text)), settings.TEST_VOICE_MAX_OUTPUT_TOKENS
    )
    rewrite = llm.estimate_cost(
        len(_rewrite_prompt(text, simulate.describe(segments[0][0]))),
        settings.TEST_REWRITE_MAX_OUTPUT_TOKENS,
    )
    return decide + voice + rewrite


def _weighted_quantile(values: np.ndarray, weights: np.ndarray, q: float) -> float:
    order = np.argsort(values)
    cum = np.cumsum(weights[order])
    return float(values[order][np.searchsorted(cum, q * cum[-1])])


def _react(
    text: str, segments: list[tuple[str, float]], budget: llm.Budget, conn: sqlite3.Connection
) -> tuple[np.ndarray, np.ndarray]:
    """Per segment, the reaction shares in REACTIONS order, and the weights."""
    shares = np.empty((len(segments), len(REACTIONS)))
    for i, (seg, _) in enumerate(segments):
        out = llm.decide("post_test", _state(seg, text), _questions(seg, text), budget, conn=conn)
        probs = out["reaction"]["probabilities"]
        shares[i] = [probs[option] for option in REACTIONS]
    return shares, np.array([w for _, w in segments])


def _landing(shares: np.ndarray) -> np.ndarray:
    keys = list(REACTIONS.values())
    return shares[:, keys.index("like")] + shares[:, keys.index("share")]


def run(req: PostTestRequest, conn: sqlite3.Connection, budget: llm.Budget) -> PostTestResult:
    """Test one post. Raises llm.BudgetExceeded before any call when the estimate passes the
    budget, and ValueError when the audience is empty."""
    segments = audience_segments(req)
    llm.check_budget(budget, estimate(segments, req.text))
    shares, weights = _react(req.text, segments, budget, conn)
    landing = _landing(shares)
    tiers = _tiers()
    rows = [
        SegmentReaction(
            segment=seg,
            label=simulate.describe(seg),
            country=seg.split("|")[0],
            coverage_tier=tiers[seg.split("|")[0]],
            weight=round(w, 6),
            landing=round(float(landing[i]), 6),
        )
        for i, (seg, w) in enumerate(segments)
    ]
    ranked = sorted(rows, key=lambda r: -r.landing)
    best, worst = ranked[:SIDE], ranked[::-1][:SIDE]
    voices = [
        Voice(
            label=r.label,
            text=llm.complete_json(
                "post_voice",
                _voice_prompt(r.segment, req.text),
                VOICE_SCHEMA,
                budget,
                max_tokens=settings.TEST_VOICE_MAX_OUTPUT_TOKENS,
                conn=conn,
            )["text"],
        )
        for r in (best[0], worst[0])
    ]
    rewrite = llm.complete_json(
        "post_rewrite",
        _rewrite_prompt(req.text, best[0].label),
        VOICE_SCHEMA,
        budget,
        max_tokens=settings.TEST_REWRITE_MAX_OUTPUT_TOKENS,
        conn=conn,
    )["text"]
    mix = shares.T @ weights
    return PostTestResult(
        landing_chance=round(float(landing @ weights), 6),
        band=[
            round(_weighted_quantile(landing, weights, 0.1), 6),
            round(_weighted_quantile(landing, weights, 0.9), 6),
        ],
        mix=Mix(**{k: round(float(v), 6) for k, v in zip(REACTIONS.values(), mix, strict=True)}),
        best=best,
        worst=worst,
        voices=voices,
        rewrite=rewrite,
        segments=len(segments),
        model_calls=len(segments) + len(voices) + 1,
        cost_usd=round(budget.spent_usd, 6),
        provider=llm.decider().name,
    )


def retrospective(req: RetroRequest, conn: sqlite3.Connection, budget: llm.Budget) -> RetroResult:
    """The engine's landing chance for posts already published, scored against how the person
    says they did. Nothing is stored."""
    segments = audience_segments(req)
    per_post = sum(
        llm.estimate_decide_cost(len(_state(s, p.text)) + 400)
        for p in req.posts
        for s, _ in segments
    )
    llm.check_budget(budget, per_post)
    posts = []
    for p in req.posts:
        shares, weights = _react(p.text, segments, budget, conn)
        chance = float(_landing(shares) @ weights)
        hit = (chance >= 0.5) == (p.outcome == "landed")
        posts.append(
            RetroPost(text=p.text, outcome=p.outcome, landing_chance=round(chance, 6), hit=hit)
        )
    brier = float(np.mean([(p.landing_chance - (p.outcome == "landed")) ** 2 for p in posts]))
    return RetroResult(posts=posts, hits=sum(p.hit for p in posts), brier=round(brier, 6))

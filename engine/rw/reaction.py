"""Message tests: how a founder's ideal customer reacts to one message (product/will-it-land.md,
decision 0016).

The ideal customer profile (ICP) is the founder's own description of a consumer. It is expanded
into 27 segments on three fixed dimensions, and each segment is asked by settings.test_agents()/27
simulated consumers, one Jev decision call each: its reaction, whether it would act, and what
stops it. One more call with no segments is the baseline. Segments are equally weighted. Two short
accounts and one rewrite come from the open text model."""

import itertools
import random
import sqlite3
from typing import Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field, model_validator

from rw import llm, settings

Gut = Literal["lands", "flops"]
Outcome = Literal["landed", "flopped"]

# Option text the model reads, and the key each reads as in the result.
REACTIONS = {
    "ignore it": "ignore",
    "read it and move on": "read",
    "like it": "like",
    "share it": "share",
}
OBJECTIONS = (
    "price",
    "trust",
    "no clear need",
    "bad timing",
    "switching cost",
    "unclear message",
    "none",
)
# Three (dimension, levels) pairs; a segment is one level of each (0016).
GRID = (
    ("Attitude to new products", ("early adopter", "pragmatist", "skeptic")),
    ("Price sensitivity", ("price-sensitive", "value-focused", "premium buyer")),
    ("Familiarity", ("new to the category", "uses a competitor", "power user")),
)
SIDE = 3
CALIBRATION = "Uncalibrated: simulated from your description, not real customers"
DISCLOSURE = "AI-simulated. Simulated from your description, not real customers."
BACKTEST_LABEL = "Backtest: not on your record"
INTENT_QUESTION = "Would this person sign up, try or buy because of this message?"
BASELINE_QUESTION = (
    "Would a typical one of these customers sign up, try or buy because of the message?"
)

VOICE_SCHEMA = {
    "type": "object",
    "properties": {"text": {"type": "string", "maxLength": 280}},
    "required": ["text"],
}


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PostTestRequest(Strict):
    text: str = Field(min_length=1, max_length=settings.EVENT_TEXT_MAX_CHARS)
    idea: str = Field(min_length=3, max_length=200, description="What you are building, one line.")
    icp: str = Field(min_length=3, max_length=300, description="The ideal customer, in your words.")
    gut: Gut | None = Field(default=None, description="The person's own call before the result.")


class Metric(Strict):
    name: str = Field(min_length=1, max_length=60, description='e.g. "signup rate"')
    value: float = Field(allow_inf_nan=False)
    unit: str = Field(min_length=1, max_length=20, description='e.g. "%" or "replies"')


class PastMessage(Strict):
    text: str = Field(min_length=1, max_length=settings.EVENT_TEXT_MAX_CHARS)
    outcome: Outcome | None = None
    metric: Metric | None = None

    @model_validator(mode="after")
    def _known(self) -> "PastMessage":
        if self.outcome is None and self.metric is None:
            raise ValueError("say what really happened: an outcome, a metric, or both")
        return self


class BacktestRequest(Strict):
    idea: str = Field(min_length=3, max_length=200)
    icp: str = Field(min_length=3, max_length=300)
    messages: list[PastMessage] = Field(min_length=1, max_length=settings.TEST_BACKTEST_MAX)


class Mix(BaseModel):
    ignore: float
    read: float
    like: float
    share: float


class ObjectionShare(BaseModel):
    objection: str
    share: float


class Dimension(BaseModel):
    name: str
    levels: list[str]


class SegmentResult(BaseModel):
    segment: str = Field(description='Stable id: the level numbers, e.g. "012".')
    cell: list[int] = Field(description="Level number on each of the three dimensions.")
    label: str = Field(description="The segment in words.")
    interest: float = Field(description="Chance this kind of customer likes or shares it.")
    intent: float = Field(description="Chance this kind of customer signs up, tries or buys.")
    agents: int = Field(description="Simulated consumers asked in this segment.")
    objection: str = Field(description="What most likely stops them.")


class Voice(BaseModel):
    label: str
    text: str
    simulated: Literal["Simulated customer"] = "Simulated customer"


class PostTestResult(BaseModel):
    intent: float = Field(
        description="Mean over segments of the chance a customer signs up, tries or buys; the"
        " number a seal and the Brier score use."
    )
    intent_band: list[float] = Field(description="p10 and p90 of intent across segments.")
    interest: float = Field(description="Mean over segments of the share who like or share it.")
    band: list[float] = Field(description="p10 and p90 of interest across segments.")
    baseline_intent: float = Field(description="One call with no segments: the plain baseline.")
    mix: Mix
    objections: list[ObjectionShare] = Field(description="Mean shares, largest first; sum to 1.")
    dimensions: list[Dimension] = Field(description="The three dimensions of the grid.")
    segments: list[SegmentResult] = Field(description="All 27, in grid order.")
    best: list[SegmentResult]
    worst: list[SegmentResult]
    voices: list[Voice]
    rewrite: str
    agents: int = Field(description="Simulated consumers asked, over all segments.")
    model_calls: int
    cost_usd: float
    provider: str
    calibration: str = CALIBRATION
    disclosure: str = DISCLOSURE


class BacktestMessage(BaseModel):
    text: str
    outcome: Outcome | None
    metric: Metric | None
    intent: float
    baseline_intent: float
    hit: bool | None = Field(description="Null without an outcome.")
    baseline_hit: bool | None


class CalibrationRow(BaseModel):
    forecaster: Literal["engine", "baseline"]
    bucket: str = Field(description='Predicted intent range, e.g. "20-40%".')
    n: int
    predicted: float = Field(description="Mean predicted intent in the bucket.")
    landed: float = Field(description="Share of the bucket's messages that landed.")


class RankAgreement(BaseModel):
    metric: str
    n: int
    engine: float | None = Field(description="Spearman correlation; null if undefined.")
    baseline: float | None


class BacktestResult(BaseModel):
    messages: list[BacktestMessage]
    marked: int = Field(description="Messages with Landed or Flopped, which hits and Brier use.")
    hits: int
    baseline_hits: int
    brier: float | None
    baseline_brier: float | None
    calibration: list[CalibrationRow]
    rank: list[RankAgreement] = Field(description="Per metric name given on 3 or more messages.")
    agents: int = Field(description="Simulated consumers asked per message.")
    model_calls: int
    cost_usd: float
    provider: str
    label: Literal["Backtest: not on your record"] = BACKTEST_LABEL
    disclosure: str = DISCLOSURE


Segment = tuple[int, ...]


def segments() -> list[Segment]:
    """The 27 grid cells in order: every combination of the three dimensions' levels (0016)."""
    return list(itertools.product(range(3), repeat=3))


def _words(seg: Segment) -> list[str]:
    return [levels[i] for (_, levels), i in zip(GRID, seg, strict=True)]


def label(seg: Segment) -> str:
    text = ", ".join(_words(seg))
    return text[0].upper() + text[1:]


def _seg_id(seg: Segment) -> str:
    return "".join(map(str, seg))


def _about(req: PostTestRequest | BacktestRequest) -> str:
    return f"Ideal customer: {req.icp}.\nProduct: {req.idea}."


def _state(about: str, seg: Segment, agent: int, text: str) -> str:
    # ponytail: agents in a segment differ only by their number; sample within-segment traits if
    # the spread across agents proves too narrow to matter.
    return (
        f"{about}\nThis person: {', '.join(_words(seg))}; simulated consumer {agent + 1}."
        f"\nMessage from a company:\n{text}"
    )


def _baseline_state(about: str, text: str) -> str:
    return f"{about}\nMessage: {text}"


def _questions(seg: Segment, text: str) -> llm.Questions:
    rng = random.Random(f"{_seg_id(seg)}|{text}")
    reactions, objections = list(REACTIONS), list(OBJECTIONS)
    rng.shuffle(reactions)
    rng.shuffle(objections)
    return {
        "reaction": {
            "type": "choice",
            "instructions": "This person sees the message. What do they most likely do?",
            "criteria": dict.fromkeys(reactions),
        },
        "intent": {"type": "noul", "instructions": INTENT_QUESTION},
        "objection": {
            "type": "choice",
            "instructions": "What most likely stops this person from acting on it?"
            ' Answer "none" if nothing does.',
            "criteria": dict.fromkeys(objections),
        },
    }


BASELINE_QUESTIONS: llm.Questions = {"intent": {"type": "noul", "instructions": BASELINE_QUESTION}}


def _voice_prompt(description: str, seg: Segment, text: str) -> str:
    return (
        f"You are {description}, {', '.join(_words(seg))}.\n"
        f"You see this message from a company:\n{text}\n"
        "In one first-person sentence of at most 30 words, say how you react and why."
        ' Answer as JSON {"text": "..."}.'
    )


def _rewrite_prompt(text: str, objection: str) -> str:
    return (
        "Rewrite this message so more of these customers would try or buy it; answer the"
        f" objection '{objection}'. Keep its meaning, under 280 characters.\nMessage:\n{text}\n"
        'Answer as JSON {"text": "..."}.'
    )


def _asks(about: str, text: str, per: int) -> list[tuple[str, llm.Questions]]:
    return [
        (_state(about, s, k, text), _questions(s, text)) for s in segments() for k in range(per)
    ]


def _decide_estimate(about: str, text: str, per: int) -> float:
    asks = [*_asks(about, text, per), (_baseline_state(about, text), BASELINE_QUESTIONS)]
    return sum(llm.estimate_decide_cost(len(llm.decide_request(*a))) for a in asks)


def _per_segment() -> int:
    return settings.test_agents() // settings.TEST_SEGMENTS


def estimate(req: PostTestRequest, per: int) -> float:
    voice = 2 * llm.estimate_cost(
        len(_voice_prompt(req.icp, segments()[0], req.text)),
        settings.TEST_VOICE_MAX_OUTPUT_TOKENS,
    )
    rewrite = llm.estimate_cost(
        len(_rewrite_prompt(req.text, "unclear message")), settings.TEST_REWRITE_MAX_OUTPUT_TOKENS
    )
    return _decide_estimate(_about(req), req.text, per) + voice + rewrite


class _Asked:
    """Per segment, in grid order and averaged over its agents: reaction shares (REACTIONS
    order), intent, objection shares (OBJECTIONS order); and the baseline's intent."""

    def __init__(self, shares: np.ndarray, intent: np.ndarray, obj: np.ndarray, base: float):
        self.shares, self.intent, self.obj, self.baseline = shares, intent, obj, base

    @property
    def interest(self) -> np.ndarray:
        keys = list(REACTIONS.values())
        return self.shares[:, keys.index("like")] + self.shares[:, keys.index("share")]


def aggregate(answers: list[dict], per: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Jev answers for segments() x per agents, in that order, to per-segment means."""
    shares = np.array([[a["reaction"]["probabilities"][o] for o in REACTIONS] for a in answers])
    intent = np.array([a["intent"]["noul"] for a in answers])
    obj = np.array([[a["objection"]["probabilities"][o] for o in OBJECTIONS] for a in answers])
    n = len(answers) // per
    return (
        shares.reshape(n, per, -1).mean(axis=1),
        intent.reshape(n, per).mean(axis=1),
        obj.reshape(n, per, -1).mean(axis=1),
    )


def _ask(about: str, text: str, per: int, budget: llm.Budget, conn: sqlite3.Connection) -> _Asked:
    workers = settings.test_agent_workers()
    answers = llm.decide_many("post_test", _asks(about, text, per), budget, conn, workers)
    base = llm.decide(
        "post_baseline", _baseline_state(about, text), BASELINE_QUESTIONS, budget, conn=conn
    )
    return _Asked(*aggregate(answers, per), float(base["intent"]["noul"]))


def _r(x: float) -> float:
    return round(float(x), 6)


def _band(x: np.ndarray) -> list[float]:
    return [_r(np.quantile(x, 0.1)), _r(np.quantile(x, 0.9))]


def _text(purpose: str, prompt: str, max_tokens: int, budget: llm.Budget, conn) -> str:
    return llm.complete_json(
        purpose, prompt, VOICE_SCHEMA, budget, max_tokens=max_tokens, conn=conn
    )["text"]


def run(req: PostTestRequest, conn: sqlite3.Connection, budget: llm.Budget) -> PostTestResult:
    """Test one message. Raises llm.BudgetExceeded before any call when the estimate passes the
    budget."""
    per = _per_segment()
    llm.check_budget(budget, estimate(req, per))
    segs = segments()
    asked = _ask(_about(req), req.text, per, budget, conn)
    interest = asked.interest
    rows = [
        SegmentResult(
            segment=_seg_id(seg),
            cell=list(seg),
            label=label(seg),
            interest=_r(interest[i]),
            intent=_r(asked.intent[i]),
            agents=per,
            objection=OBJECTIONS[int(np.argmax(asked.obj[i]))],
        )
        for i, seg in enumerate(segs)
    ]
    ranked = sorted(rows, key=lambda r: (-r.intent, -r.interest))
    best, worst = ranked[:SIDE], ranked[::-1][:SIDE]
    by_id = dict(zip((_seg_id(s) for s in segs), segs, strict=True))
    voices = [
        Voice(
            label=r.label,
            text=_text(
                "post_voice",
                _voice_prompt(req.icp, by_id[r.segment], req.text),
                settings.TEST_VOICE_MAX_OUTPUT_TOKENS,
                budget,
                conn,
            ),
        )
        for r in (best[0], worst[0])
    ]
    objections = sorted(
        (
            ObjectionShare(objection=o, share=_r(s))
            for o, s in zip(OBJECTIONS, asked.obj.mean(axis=0), strict=True)
        ),
        key=lambda o: -o.share,
    )
    top = next(o.objection for o in objections if o.objection != "none")
    rewrite = _text(
        "post_rewrite",
        _rewrite_prompt(req.text, top),
        settings.TEST_REWRITE_MAX_OUTPUT_TOKENS,
        budget,
        conn,
    )
    mix = asked.shares.mean(axis=0)
    return PostTestResult(
        intent=_r(asked.intent.mean()),
        intent_band=_band(asked.intent),
        interest=_r(interest.mean()),
        band=_band(interest),
        baseline_intent=_r(asked.baseline),
        mix=Mix(**{k: _r(v) for k, v in zip(REACTIONS.values(), mix, strict=True)}),
        objections=objections,
        dimensions=[Dimension(name=n, levels=list(lv)) for n, lv in GRID],
        segments=rows,
        best=best,
        worst=worst,
        voices=voices,
        rewrite=rewrite,
        agents=per * len(segs),
        model_calls=per * len(segs) + 1 + len(voices) + 1,
        cost_usd=_r(budget.spent_usd),
        provider=llm.decider().name,
    )


def _ranks(x: np.ndarray) -> np.ndarray:
    r = np.empty(len(x))
    r[np.argsort(x, kind="stable")] = np.arange(len(x))
    for v in np.unique(x):
        r[x == v] = r[x == v].mean()
    return r


def spearman(a: list[float], b: list[float]) -> float | None:
    """Rank correlation with ties averaged; None when either side has no spread."""
    ra, rb = _ranks(np.asarray(a, float)), _ranks(np.asarray(b, float))
    if ra.std() == 0 or rb.std() == 0:
        return None
    return _r(np.corrcoef(ra, rb)[0, 1])


def _calibration(rows: list[BacktestMessage]) -> list[CalibrationRow]:
    k = settings.TEST_BACKTEST_BUCKETS
    marked = [m for m in rows if m.outcome is not None]
    out = []
    for name in ("engine", "baseline"):
        buckets: dict[int, list[tuple[float, bool]]] = {}
        for m in marked:
            p = m.intent if name == "engine" else m.baseline_intent
            buckets.setdefault(min(int(p * k), k - 1), []).append((p, m.outcome == "landed"))
        out += [
            CalibrationRow(
                forecaster=name,  # type: ignore[arg-type]
                bucket=f"{round(b * 100 / k)}-{round((b + 1) * 100 / k)}%",
                n=len(inside),
                predicted=_r(np.mean([p for p, _ in inside])),
                landed=_r(np.mean([y for _, y in inside])),
            )
            for b, inside in sorted(buckets.items())
        ]
    return out


def backtest(req: BacktestRequest, conn: sqlite3.Connection, budget: llm.Budget) -> BacktestResult:
    """The engine's and the baseline's intent for messages already shipped, scored against what
    the person says happened. Nothing is stored."""
    about, per = _about(req), _per_segment()
    llm.check_budget(budget, sum(_decide_estimate(about, m.text, per) for m in req.messages))
    rows = []
    for m in req.messages:
        asked = _ask(about, m.text, per, budget, conn)
        intent, base = float(asked.intent.mean()), asked.baseline
        landed = None if m.outcome is None else m.outcome == "landed"
        rows.append(
            BacktestMessage(
                text=m.text,
                outcome=m.outcome,
                metric=m.metric,
                intent=_r(intent),
                baseline_intent=_r(base),
                hit=None if landed is None else (intent >= 0.5) == landed,
                baseline_hit=None if landed is None else (base >= 0.5) == landed,
            )
        )
    marked = [m for m in rows if m.outcome is not None]

    def brier(pred: str) -> float | None:
        if not marked:
            return None
        return _r(np.mean([(getattr(m, pred) - (m.outcome == "landed")) ** 2 for m in marked]))

    by_metric: dict[str, list[BacktestMessage]] = {}
    for m in rows:
        if m.metric is not None:
            by_metric.setdefault(m.metric.name.lower(), []).append(m)
    rank = [
        RankAgreement(
            metric=name,
            n=len(ms),
            engine=spearman([m.intent for m in ms], [m.metric.value for m in ms]),  # type: ignore[union-attr]
            baseline=spearman([m.baseline_intent for m in ms], [m.metric.value for m in ms]),  # type: ignore[union-attr]
        )
        for name, ms in by_metric.items()
        if len(ms) >= settings.TEST_BACKTEST_RANK_MIN
    ]
    return BacktestResult(
        messages=rows,
        marked=len(marked),
        hits=sum(bool(m.hit) for m in marked),
        baseline_hits=sum(bool(m.baseline_hit) for m in marked),
        brier=brier("intent"),
        baseline_brier=brier("baseline_intent"),
        calibration=_calibration(rows),
        rank=rank,
        agents=per * settings.TEST_SEGMENTS,
        model_calls=len(req.messages) * (per * settings.TEST_SEGMENTS + 1),
        cost_usd=_r(budget.spent_usd),
        provider=llm.decider().name,
    )

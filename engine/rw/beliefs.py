"""The only operators that change agent beliefs. Beliefs are logits, shape (n_agents, n_topics)."""

from collections.abc import Mapping
from typing import Any, NamedTuple

import numpy as np

from rw.settings import ANCHOR_PULL, NUDGE_CAP_LOGIT, SPREAD_BAND, STEP_CAP_LOGIT


class Nudge(NamedTuple):
    group_id: Any
    topic_index: int
    wanted: float
    applied: float


class AuditRow(NamedTuple):
    country: Any
    topic_index: int
    sim_sd: float
    survey_sd: float
    ratio: float
    in_band: bool


def update_beliefs(
    B: np.ndarray, B0: np.ndarray, s: np.ndarray, signal: np.ndarray, exposed: np.ndarray
) -> np.ndarray:
    """One day: exposed agents take a capped step scaled by 1 - s, then all are pulled to B0."""
    B = np.asarray(B, dtype=float)
    exposed = np.asarray(exposed, dtype=bool)
    if exposed.ndim == 1:
        exposed = exposed[:, None]
    pushed = np.asarray(signal) * (1 - np.asarray(s)[:, None])
    step = np.clip(pushed, -STEP_CAP_LOGIT, STEP_CAP_LOGIT)
    return B + np.where(exposed, step, 0.0) + ANCHOR_PULL * (B0 - B)


def logit(p: float) -> float:
    if not 0 < p < 1:
        raise ValueError(f"share must be strictly between 0 and 1, got {p}")
    return float(np.log(p / (1 - p)))


def nudge(
    B: np.ndarray,
    group_ids: np.ndarray,
    targets: Mapping[tuple[Any, int], float],
    cap: float = NUDGE_CAP_LOGIT,
) -> tuple[np.ndarray, list[Nudge]]:
    """Shift each group toward an observed share by at most cap in logit; groups with no agents
    are skipped and get no record."""
    out = np.array(B, dtype=float)
    group_ids = np.asarray(group_ids)
    records = []
    for (group_id, topic), share in targets.items():
        mask = group_ids == group_id
        if not mask.any():
            continue
        wanted = logit(share) - float(out[mask, topic].mean())
        applied = float(np.clip(wanted, -cap, cap))
        out[mask, topic] += applied
        records.append(Nudge(group_id, topic, wanted, applied))
    return out, records


def spread_audit(
    B: np.ndarray, country_ids: np.ndarray, survey_sd: Mapping[tuple[Any, int], float]
) -> list[AuditRow]:
    """Compare simulated and survey SD per (country, topic); absent countries are skipped."""
    B = np.asarray(B, dtype=float)
    country_ids = np.asarray(country_ids)
    lo, hi = SPREAD_BAND
    rows = []
    for (country, topic), sd in survey_sd.items():
        if not sd > 0:
            raise ValueError(f"survey SD for {country}, topic {topic} must be positive, got {sd}")
        mask = country_ids == country
        if not mask.any():
            continue
        sim_sd = float(B[mask, topic].std())
        ratio = sim_sd / sd
        rows.append(AuditRow(country, topic, sim_sd, sd, ratio, lo <= ratio <= hi))
    return rows

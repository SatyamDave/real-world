"""Scores resolved binary forecasts and their skill against each baseline under the protocol."""

import hashlib
import json
import math
import sqlite3
from collections import defaultdict
from pathlib import Path
from statistics import fmean
from typing import Any

import numpy as np

PROTOCOL_JSON = Path(__file__).resolve().parents[2] / "data" / "protocol.json"

Row = dict[str, Any]


def load_protocol() -> dict[str, Any]:
    return json.loads(PROTOCOL_JSON.read_bytes())


def protocol_hash() -> str:
    return hashlib.sha256(PROTOCOL_JSON.read_bytes()).hexdigest()


def _check(p: float, o: int) -> None:
    if o not in (0, 1) or not 0.0 <= p <= 1.0:
        raise ValueError(f"need p in [0, 1] and o in {{0, 1}}, got p={p!r} o={o!r}")


def brier(p: float, o: int) -> float:
    _check(p, o)
    return (p - o) ** 2


def log_score(p: float, o: int, clip: tuple[float, float] | list[float]) -> float:
    """Log of the probability given to what happened: 0 is perfect, more negative is worse."""
    _check(p, o)
    lo, hi = clip
    p = min(max(p, lo), hi)
    return math.log(p if o == 1 else 1 - p)


def paired_differences(rows: list[Row], baseline: str) -> list[Row]:
    """Brier(sim) - Brier(baseline) for every resolved question and date both forecast."""
    forecasts: dict[tuple[str, str, str], Row] = {}
    for r in rows:
        if r["outcome"] is None:
            continue
        key = (r["forecaster"], r["question_id"], r["date"])
        if key in forecasts:
            raise ValueError(f"duplicate forecast {key}")
        forecasts[key] = r

    pairs = []
    for (forecaster, question_id, date), sim in sorted(forecasts.items()):
        if forecaster != "sim":
            continue
        base = forecasts.get((baseline, question_id, date))
        if base is None:
            continue
        o = sim["outcome"]
        if base["outcome"] != o:
            raise ValueError(f"{question_id} {date}: sim and {baseline} rows disagree on outcome")
        diff = brier(float(sim["probability"]), o) - brier(float(base["probability"]), o)
        pairs.append(
            {
                "question_id": question_id,
                "date": date,
                "tier": sim["tier"],
                "region": sim["region"],
                "diff": diff,
            }
        )
    return pairs


def block_bootstrap(
    diffs_by_day: dict[str, list[float]], resamples: int, seed: int, interval: float
) -> tuple[float, float]:
    """Percentile interval for the mean difference, resampling whole days with replacement."""
    days = sorted(diffs_by_day)
    if not days:
        raise ValueError("no days to resample")
    sums = np.array([sum(diffs_by_day[d]) for d in days])
    counts = np.array([len(diffs_by_day[d]) for d in days])
    idx = np.random.default_rng(seed).integers(0, len(days), size=(resamples, len(days)))
    means = sums[idx].sum(axis=1) / counts[idx].sum(axis=1)
    tail = (1 - interval) / 2
    low, high = np.quantile(means, [tail, 1 - tail])
    return float(low), float(high)


def _summary(pairs: list[Row], protocol: dict[str, Any]) -> Row:
    # n counts distinct questions, not question-days, so daily repeats cannot reach the claim bar.
    n = len({p["question_id"] for p in pairs})
    claim = "reportable" if n >= protocol["min_resolved_for_claims"] else "insufficient_n"
    out: Row = {"n": n, "n_pairs": len(pairs), "mean_diff": None, "low": None, "high": None}
    if pairs:
        by_day: dict[str, list[float]] = defaultdict(list)
        for p in pairs:
            by_day[p["date"]].append(p["diff"])
        b = protocol["bootstrap"]
        out["mean_diff"] = fmean(p["diff"] for p in pairs)
        out["low"], out["high"] = block_bootstrap(by_day, b["resamples"], b["seed"], b["interval"])
    out["claim"] = claim
    return out


def summarize(rows: list[Row], protocol: dict[str, Any]) -> dict[str, Row]:
    """Per baseline: n, mean Brier difference (negative means sim was better), interval, claim."""
    if (
        protocol["headline"] != "brier"
        or protocol["question_types"] != ["binary"]
        or protocol["bootstrap"]["block"] != "day"
    ):
        raise ValueError(f"protocol {protocol['version']} asks for scoring this module lacks")
    result = {}
    for baseline in protocol["baselines"]:
        pairs = paired_differences(rows, baseline)
        summary = _summary(pairs, protocol)
        for key in protocol["breakdowns"]:
            groups: dict[str, list[Row]] = defaultdict(list)
            for p in pairs:
                groups[p[key]].append(p)
            summary[f"by_{key}"] = {g: _summary(ps, protocol) for g, ps in sorted(groups.items())}
        result[baseline] = summary
    return result


def record_resolution(
    conn: sqlite3.Connection,
    question_id: str,
    outcome: int,
    resolved_on: str,
    source_url: str,
    read_on: str,
) -> None:
    """Insert a question's outcome once; a second one raises IntegrityError."""
    with conn:
        conn.execute(
            "INSERT INTO resolutions (question_id, outcome, resolved_on, source_url, read_on)"
            " VALUES (?, ?, ?, ?, ?)",
            (question_id, outcome, resolved_on, source_url, read_on),
        )


def write_scores(conn: sqlite3.Connection, rows: list[Row]) -> None:
    clip = load_protocol()["log_clip"]
    scored = [
        (
            r["date"],
            r["question_id"],
            r["forecaster"],
            brier(float(r["probability"]), r["outcome"]),
            log_score(float(r["probability"]), r["outcome"], clip),
        )
        for r in rows
        if r["outcome"] is not None
    ]
    with conn:
        conn.executemany(
            "INSERT INTO scores (date, question_id, forecaster, brier, log_score)"
            " VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
            scored,
        )

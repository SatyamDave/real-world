"""The self-improving loop: fit a recalibration map on old resolved questions, test it on fresh
ones, and promote it forward-only when it clears the pre-registered bar (decision 0008)."""

import json
import math
import sqlite3
from collections import Counter, defaultdict
from datetime import date as Date
from datetime import timedelta
from statistics import fmean
from typing import Any

import numpy as np

from rw import ledger, score, settings

IDENTITY = {"a": 1.0, "b": 0.0}
Row = dict[str, Any]


def _logit(p: np.ndarray) -> np.ndarray:
    p = np.clip(p, settings.P_EPS, 1 - settings.P_EPS)
    return np.log(p / (1 - p))


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1 / (1 + np.exp(-np.clip(x, -30, 30)))


def apply_map(params: dict[str, float], p: float) -> float:
    return float(_sigmoid(params["a"] * _logit(np.array(p)) + params["b"]))


def fit_platt(raw: np.ndarray, outcome: np.ndarray, weight: np.ndarray) -> dict[str, float]:
    """Weighted log loss plus IMPROVE_L2 * distance from identity, minimized by Newton steps."""
    x, y, w = _logit(raw), outcome.astype(float), weight / weight.sum()
    theta = np.array([1.0, 0.0])
    prior = theta.copy()
    lam = settings.IMPROVE_L2
    for _ in range(50):
        q = _sigmoid(theta[0] * x + theta[1])
        X = np.column_stack([x, np.ones_like(x)])
        grad = X.T @ (w * (q - y)) + 2 * lam * (theta - prior)
        hess = (X * (w * q * (1 - q))[:, None]).T @ X + 2 * lam * np.eye(2)
        step = np.linalg.solve(hess, grad)
        theta = theta - step
        if np.abs(step).max() < 1e-10:
            break
    return {"a": float(theta[0]), "b": float(theta[1])}


def next_day(date: str) -> str:
    return (Date.fromisoformat(date) + timedelta(days=1)).isoformat()


def evaluate(rows: list[Row], incumbent: Row) -> Row:
    """Decide whether a freshly fitted map replaces the incumbent. rows hold one raw `sim`
    forecast per question-day with its outcome and resolved_on; nothing here touches storage."""
    resolved_on = {r["question_id"]: r["resolved_on"] for r in rows}
    order = sorted(resolved_on, key=lambda q: (resolved_on[q], q))
    fresh = [q for q in order if resolved_on[q] >= incumbent["effective_from"]]
    holdout = set(fresh[-settings.IMPROVE_HOLDOUT_QUESTIONS :])
    start = min((resolved_on[q] for q in holdout), default="")
    train = [q for q in order if resolved_on[q] < start]
    out: Row = {"n_train": len(train), "n_holdout": len(holdout), "promote": False}
    if len(holdout) < settings.IMPROVE_HOLDOUT_QUESTIONS:
        return {**out, "reason": "insufficient_n: too few questions resolved since the incumbent"}
    if len(train) < settings.IMPROVE_MIN_TRAIN_QUESTIONS:
        return {**out, "reason": "insufficient_n: too few training questions"}

    train_set = set(train)
    tr = [r for r in rows if r["question_id"] in train_set]
    days = Counter(r["question_id"] for r in tr)
    candidate = fit_platt(
        np.array([r["raw"] for r in tr]),
        np.array([r["outcome"] for r in tr]),
        np.array([1 / days[r["question_id"]] for r in tr]),
    )

    if not all(math.isfinite(v) for v in candidate.values()):
        return {**out, "reason": "not_finite: incumbent kept"}

    by_day: dict[str, list[float]] = defaultdict(list)
    before, after = [], []
    for r in rows:
        if r["question_id"] in holdout:
            b = score.brier(apply_map(incumbent["params"], r["raw"]), r["outcome"])
            a = score.brier(apply_map(candidate, r["raw"]), r["outcome"])
            before.append(b)
            after.append(a)
            by_day[r["date"]].append(a - b)
    boot = score.load_protocol()["bootstrap"]
    low, high = score.block_bootstrap(by_day, boot["resamples"], boot["seed"], boot["interval"])
    mean_diff = fmean(a - b for a, b in zip(after, before, strict=True))
    out |= {
        "candidate": candidate,
        "brier_before": fmean(before),
        "brier_after": fmean(after),
        "mean_diff": mean_diff,
        "low": low,
        "high": high,
    }
    if not all(math.isfinite(v) for v in (mean_diff, low, high)):
        return {**out, "reason": "not_finite: incumbent kept"}
    if mean_diff > -settings.IMPROVE_MARGIN_BRIER or high >= 0:
        return {**out, "reason": "rejected: did not beat the incumbent by the margin"}
    return {**out, "promote": True, "reason": "promoted"}


def active(conn: sqlite3.Connection, date: str) -> Row:
    """The version in force on date: the latest row effective on or before it, else identity."""
    row = conn.execute(
        "SELECT * FROM engine_versions WHERE effective_from <= ?"
        " ORDER BY effective_from DESC, rowid DESC LIMIT 1",
        (date,),
    ).fetchone()
    if row is None:
        return {"version": "", "effective_from": "", "params": IDENTITY}
    return {**dict(row), "params": json.loads(row["params_json"])}


def _append(conn: sqlite3.Connection, record: Row) -> str:
    version = ledger.sha256_hex(ledger.canonical_json(record))
    with conn:
        conn.execute(
            "INSERT INTO engine_versions (version, parent, effective_from, params_json,"
            " record_json) VALUES (?, ?, ?, ?, ?)",
            (
                version,
                record["parent"],
                record["effective_from"],
                json.dumps({k: float(v) for k, v in record["params"].items()}),
                ledger.canonical_json(record).decode(),
            ),
        )
    return version


def _strs(values: dict[str, Any]) -> dict[str, str]:
    return {k: f"{v:.6f}" if isinstance(v, float) else str(v) for k, v in values.items()}


def promote(conn: sqlite3.Connection, date: str, decision: Row) -> str:
    """Append the candidate as the version in force from the day after date; return its id."""
    keys = ("n_train", "n_holdout", "brier_before", "brier_after", "mean_diff", "low", "high")
    return _append(
        conn,
        {
            "parent": active(conn, date)["version"],
            "decided_on": date,
            "effective_from": next_day(date),
            "params": _strs(decision["candidate"]),
            "evidence": _strs({k: decision[k] for k in keys}),
        },
    )


def pin(conn: sqlite3.Connection, version: str, date: str) -> str:
    """Roll back by re-pinning an earlier version's params from the day after date."""
    old = conn.execute("SELECT * FROM engine_versions WHERE version = ?", (version,)).fetchone()
    if old is None:
        raise ValueError(f"no engine version {version}")
    return _append(
        conn,
        {
            "parent": active(conn, date)["version"],
            "decided_on": date,
            "effective_from": next_day(date),
            "params": json.loads(old["record_json"])["params"],
            "evidence": {"pinned": version},
        },
    )


def unrecorded(conn: sqlite3.Connection, date: str) -> list[Row]:
    """Versions in force by date that no earlier ledger day carries yet, as ledger entries."""
    seen = {
        r[0]
        for r in conn.execute(
            "SELECT json_extract(entry_json, '$.version') FROM ledger_leaves WHERE date < ?"
            " AND json_extract(entry_json, '$.kind') = 'engine_config'",
            (date,),
        )
    }
    rows = conn.execute(
        "SELECT version, record_json FROM engine_versions WHERE effective_from <= ?"
        " ORDER BY effective_from, rowid",
        (date,),
    )
    return [
        {"kind": "engine_config", "date": date, "version": v, **json.loads(rec)}
        for v, rec in rows
        if v not in seen
    ]

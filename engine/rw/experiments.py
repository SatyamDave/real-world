"""Run a pre-registered experiment and write its results as an artifact papers may cite.

A run refuses to start unless experiments/<ID>/PREREG.md hashes to the value in REGISTRY.md.
"""

import argparse
import csv
import hashlib
import json
import re
import subprocess
import sys
from collections.abc import Callable, Mapping, Sequence
from datetime import UTC, datetime
from pathlib import Path
from statistics import fmean
from typing import Any

import numpy as np

from rw import beliefs, db, forecast, llm, population, score, settings

REPO = Path(__file__).resolve().parents[2]
EXPERIMENTS = REPO / "experiments"

# E003 design. 50 seeds, 30 days, 20% observed per day and 10,000 resamples are fixed by its
# PREREG; the noise, walk, shock and bias sizes are ours, since it only says they are known.
E003_SEEDS = 50
E003_DAYS = 30
E003_AGENTS = 2000
E003_TOPICS = 5
E003_OBSERVED_SHARE = 0.2
E003_POLL_NOISE_LOGIT = 0.2
E003_WALK_SD_LOGIT = 0.05
E003_SHOCK_DAYS = (10, 20)
E003_SHOCK_SD_LOGIT = 0.5
E003_PRIOR_BIAS_LOGIT = 0.5
E003_PRIOR_NOISE_LOGIT = 0.3
E003_RESAMPLES = 10_000
# E006 design, fixed by its PREREG: new seeds, v2 at the settings walk SD, halved and doubled.
E006_SEEDS = range(1000, 1050)
E006_V2_ARMS = {
    "v2": settings.KALMAN_WALK_SD_LOGIT,
    "v2_walk_half": settings.KALMAN_WALK_SD_LOGIT / 2,
    "v2_walk_double": settings.KALMAN_WALK_SD_LOGIT * 2,
}
E001_COST_CAP_USD = 100.0
NAIVE_PROBABILITY = 0.5
BOOTSTRAP_SEED = 7

FAKE_NOTE = (
    "Provider fake: these numbers come from the fake model. Fake-model results test"
    " the pipeline, not the science, and support no claim."
)

# Experiments whose pre-registered data does not exist yet: the input and the PREREG section.
MISSING = {
    "E001": ("Pew Research Center Spring 2026 Global Attitudes crosstabs", "Data"),
    "E002": ("WVS wave 7 aggregates and Pew Spring 2026 post-cutoff test items", "Data"),
    "E004": ("resolved questions in the live hashed forecast ledger", "Data"),
    "E005": ("post-cutoff human-translated survey instruments with published marginals", "Data"),
    "E010": ("100 eligible marked message tests with a baseline and a gut call", "Data"),
}

Row = dict[str, Any]
Outcome = dict[str, Any]


class NotRegistered(Exception):
    pass


class MissingInput(Exception):
    pass


def registry(root: Path = EXPERIMENTS) -> dict[str, Row]:
    """Rows of REGISTRY.md by experiment id: title, sha256 and status."""
    rows = {}
    for line in (root / "REGISTRY.md").read_text().splitlines():
        m = re.match(r"\| \[(E\d+)\]\([^)]*\) \|", line)
        if m:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            rows[m.group(1)] = {
                "title": cells[1],
                "registered": cells[2],
                "owner": cells[3],
                "sha256": cells[4].strip("`"),
                "status": cells[5],
            }
    return rows


def prereg_sha256(exp_id: str, root: Path = EXPERIMENTS) -> str:
    return hashlib.sha256((root / exp_id / "PREREG.md").read_bytes()).hexdigest()


def check_registration(exp_id: str, root: Path = EXPERIMENTS) -> str:
    """Return the PREREG hash, or raise unless it matches the REGISTRY.md row."""
    row = registry(root).get(exp_id)
    if row is None:
        raise NotRegistered(f"{exp_id} has no row in REGISTRY.md; register it before any run")
    path = root / exp_id / "PREREG.md"
    if not path.exists():
        raise NotRegistered(f"{exp_id}: {path} does not exist")
    actual = prereg_sha256(exp_id, root)
    if actual != row["sha256"]:
        raise NotRegistered(
            f"{exp_id}: PREREG.md sha256 {actual} does not match REGISTRY.md {row['sha256']};"
            " the plan changed after registration, so nothing ran"
        )
    return actual


def prereg_section(exp_id: str, heading: str, root: Path = EXPERIMENTS) -> str:
    """The text under `## heading` in an experiment's PREREG.md, up to the next heading."""
    text = (root / exp_id / "PREREG.md").read_text()
    m = re.search(rf"^## {re.escape(heading)}\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    return m.group(1).strip() if m else ""


def results(exp_id: str, root: Path = EXPERIMENTS) -> list[Row]:
    """Each committed run of an experiment, oldest first, read from its results.json."""
    out = []
    for path in sorted((root / exp_id / "results").glob("*/results.json")):
        r = json.loads(path.read_text())
        key = next((k for k in r["metrics"] if k.startswith("primary")), None)
        m = r["metrics"].get(key) if key else None
        out.append(
            {
                "path": str((path.parent / "RESULTS.md").relative_to(root.parent)),
                "date": r["started_at"][:10],
                "command": r["command"],
                "commit": r["git_commit"],
                "provider": r["provider"],
                "model": r["model"],
                "primary": m
                and {
                    "metric": key,
                    "value": m["mean"],
                    "low": m["low"],
                    "high": m["high"],
                    "n": m["n"],
                },
                "outcome": (m or {}).get("verdict", "no verdict recorded"),
            }
        )
    return out


def _rmse(x: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(x)))) if x.size else float("nan")


def _segment_means(B: np.ndarray, seg: np.ndarray, n_seg: int) -> np.ndarray:
    counts = np.bincount(seg, minlength=n_seg)
    sums = [np.bincount(seg, weights=B[:, j], minlength=n_seg) for j in range(B.shape[1])]
    return np.column_stack(sums) / counts[:, None]


def _segment_sds(B: np.ndarray, seg: np.ndarray, n_seg: int) -> np.ndarray:
    mean = _segment_means(B, seg, n_seg)
    return np.sqrt(np.maximum(_segment_means(B * B, seg, n_seg) - mean * mean, 0.0))


def e003_seed(
    seed: int, days: int = E003_DAYS, v2_walk_sds: Mapping[str, float] | None = None
) -> list[Row]:
    """One seed of E003: per day and arm, logit RMSE of segment beliefs against the hidden truth.

    The truth is a population.py world whose segment beliefs walk in logit space; the model starts
    from a biased copy and runs the daily operators (update_beliefs, then nudge on polls).
    v2_walk_sds adds one kalman_update arm per name with that walk SD (E006); it draws no random
    numbers, so the other arms match E003 exactly."""
    rng = np.random.default_rng(seed)
    world = population.sample_population(E003_AGENTS, seed)
    tps = population.topics()[:E003_TOPICS]
    _, seg = np.unique(world["segment"], return_inverse=True)
    n_seg = int(seg.max()) + 1
    T0 = np.column_stack([world[f"b0_{t}"] for t in tps])
    truth = _segment_means(T0, seg, n_seg)
    bias = E003_PRIOR_BIAS_LOGIT + rng.normal(0.0, E003_PRIOR_NOISE_LOGIT, truth.shape)
    B0 = T0 + bias[seg]
    s = world["s"]
    no_signal = np.zeros_like(B0)
    unexposed = np.zeros(len(B0), dtype=bool)

    arms = {"none": B0.copy(), "nudge": B0.copy()}
    walks = v2_walk_sds or {}
    v2 = {
        name: (B0.copy(), np.zeros_like(B0), np.full_like(B0, settings.KALMAN_PRIOR_SD_LOGIT**2))
        for name in walks
    }
    sd0 = _segment_sds(B0, seg, n_seg)
    held = _segment_means(B0, seg, n_seg)
    seen_ever = np.zeros(truth.shape, dtype=bool)
    rows = []
    for day in range(1, days + 1):
        truth = truth + rng.normal(0.0, E003_WALK_SD_LOGIT, truth.shape)
        if day in E003_SHOCK_DAYS:
            truth = truth + rng.normal(0.0, E003_SHOCK_SD_LOGIT, truth.shape)
        seen = rng.random(truth.shape) < E003_OBSERVED_SHARE
        poll = truth + rng.normal(0.0, E003_POLL_NOISE_LOGIT, truth.shape)

        for arm in arms:
            arms[arm] = beliefs.update_beliefs(arms[arm], B0, s, no_signal, unexposed)
        targets = {
            (int(i), int(j)): float(1 / (1 + np.exp(-poll[i, j])))
            for i, j in zip(*np.nonzero(seen), strict=True)
        }
        arms["nudge"], _ = beliefs.nudge(arms["nudge"], seg, targets)
        polls = {cell: (share, E003_POLL_NOISE_LOGIT) for cell, share in targets.items()}
        for name, (B, C, P) in v2.items():
            B = beliefs.update_beliefs(B, B0 + C, s, no_signal, unexposed)
            v2[name] = beliefs.kalman_update(B, C, P, seg, polls, walks[name])[:3]
        held = np.where(seen, poll, held)
        seen_ever |= seen

        estimates = {arm: _segment_means(B, seg, n_seg) for arm, B in arms.items()}
        estimates["persistence"] = held
        extra: dict[str, dict[str, float]] = {}
        for name, (B, _, P) in v2.items():
            estimates[name] = _segment_means(B, seg, n_seg)
            extra[name] = {
                "filter_sd_logit": float(np.sqrt(_segment_means(P, seg, n_seg).mean())),
                "max_within_sd_change": float(np.abs(_segment_sds(B, seg, n_seg) - sd0).max()),
            }
        blank = {"filter_sd_logit": float("nan"), "max_within_sd_change": float("nan")}
        for arm, est in estimates.items():
            err = est - truth
            rows.append(
                {
                    "seed": seed,
                    "day": day,
                    "arm": arm,
                    "rmse_logit": _rmse(err),
                    "rmse_logit_never_observed": _rmse(err[~seen_ever]),
                    "cells_never_observed": int((~seen_ever).sum()),
                    "cells": int(err.size),
                    **(extra.get(arm, blank) if v2 else {}),
                }
            )
    # With no observations the operators must not shrink the spread of beliefs.
    ratio = arms["none"].var(axis=0) / B0.var(axis=0)
    for r in rows:
        r["zero_evidence_min_variance_ratio"] = float(ratio.min())
    return rows


def _interval(diffs: dict[Any, float]) -> dict[str, Any]:
    """Mean paired difference with a 95% bootstrap interval, resampling seeds."""
    if not diffs:
        return {"n": 0, "mean": None, "low": None, "high": None}
    low, high = score.block_bootstrap(
        {k: [v] for k, v in diffs.items()}, E003_RESAMPLES, BOOTSTRAP_SEED, 0.95
    )
    return {"n": len(diffs), "mean": fmean(diffs.values()), "low": low, "high": high}


def _fmt(m: dict[str, Any]) -> str:
    if m["n"] == 0:
        return "n = 0, not computed"
    return f"{m['mean']:+.4f} (95% interval {m['low']:+.4f} to {m['high']:+.4f}, n = {m['n']})"


def run_e003() -> Outcome:
    seeds = list(range(E003_SEEDS))
    rows = [r for seed in seeds for r in e003_seed(seed)]
    last = {(r["seed"], r["arm"]): r for r in rows if r["day"] == E003_DAYS}

    def diff(a: str, b: str, key: str) -> dict[int, float]:
        out = {s: last[s, a][key] - last[s, b][key] for s in seeds}
        return {s: d for s, d in out.items() if not np.isnan(d)}

    primary = _interval(diff("nudge", "none", "rmse_logit"))
    never = _interval(diff("nudge", "none", "rmse_logit_never_observed"))
    vs_persistence = _interval(diff("nudge", "persistence", "rmse_logit"))
    ratios = [last[s, "none"]["zero_evidence_min_variance_ratio"] for s in seeds]
    zero_ok = min(ratios) >= 1 - 1e-9
    curve = {
        arm: [
            fmean(r["rmse_logit"] for r in rows if r["arm"] == arm and r["day"] == d)
            for d in range(1, E003_DAYS + 1)
        ]
        for arm in ("none", "nudge", "persistence")
    }
    wins = primary["high"] is not None and primary["high"] < 0
    metrics = {
        "primary_day30_rmse_nudge_minus_none": {
            **primary,
            "verdict": "supported" if wins else "not supported",
        },
        "never_observed_day30_rmse_nudge_minus_none": never,
        "day30_rmse_nudge_minus_persistence": vs_persistence,
        "etkf": {
            "status": "not run",
            "reason": "the engine has no ETKF and this runner uses only engine functions",
        },
        "spread_skill_ratio": {
            "status": "not computed",
            "reason": "the nudging arm runs one member, so it has no ensemble spread",
        },
        "zero_evidence_variance_does_not_shrink": {
            "passed": zero_ok,
            "min_variance_ratio": min(ratios),
        },
        "rmse_logit_by_day": curve,
    }
    verdict = metrics["primary_day30_rmse_nudge_minus_none"]["verdict"]
    shown = [*range(0, E003_DAYS, 5), E003_DAYS - 1]
    by_day = "; ".join(
        f"day {d + 1}: "
        + " / ".join(f"{curve[a][d]:.3f}" for a in ("none", "nudge", "persistence"))
        for d in shown
    )
    report = [
        "- Primary, day-30 RMSE in logit, nudging minus no assimilation, paired by seed:"
        f" {_fmt(primary)}. Verdict: {verdict}; nudging wins only if the whole interval is"
        " below zero.",
        f"- Same, cells never observed by day 30: {_fmt(never)}"
        " (n counts seeds with at least one such cell).",
        f"- Day-30 RMSE, nudging minus persistence: {_fmt(vs_persistence)}.",
        "- ETKF arm: not run. The engine has no ETKF, so the DAPPER check could not run and the"
        " arm is dropped, as the PREREG baseline section allows.",
        "- Spread-skill ratio: not computed. The nudging arm is one member with no ensemble"
        " spread.",
        "- Zero-evidence property (variance does not shrink with no observations):"
        f" {'pass' if zero_ok else 'fail'}, smallest variance ratio {min(ratios):.6f}.",
        f"- Mean RMSE in logit by day (none / nudge / persistence): {by_day}."
        " Every day is in results.json.",
    ]
    segments = rows[0]["cells"] // E003_TOPICS
    deviations = [
        "Segments are population.py's country x age band x education segments present in a"
        f" {E003_AGENTS}-agent world ({segments} on seed 0), not 200, and topics are the first"
        f" {E003_TOPICS} in data/topics.csv.",
        "The noisy market aggregate is not generated: market prices never enter assimilation"
        " (engine/CLAUDE.md).",
        "The ETKF arm and the spread-skill ratio are not computed, for the reasons above.",
    ]
    return {
        "metrics": metrics,
        "n": len(seeds),
        "seeds": seeds,
        "rows": rows,
        "report": report,
        "deviations": deviations,
        "uses_llm": False,
        "cost_usd": 0.0,
    }


def run_e006() -> Outcome:
    seeds = list(E006_SEEDS)
    rows = [r for seed in seeds for r in e003_seed(seed, v2_walk_sds=E006_V2_ARMS)]
    last = {(r["seed"], r["arm"]): r for r in rows if r["day"] == E003_DAYS}

    def diff(a: str, b: str, key: str = "rmse_logit") -> dict[str, Any]:
        out = {s: last[s, a][key] - last[s, b][key] for s in seeds}
        return _interval({s: d for s, d in out.items() if not np.isnan(d)})

    primary = diff("v2", "persistence")
    wins = primary["high"] is not None and primary["high"] < 0
    calibration = [last[s, "v2"]["rmse_logit"] / last[s, "v2"]["filter_sd_logit"] for s in seeds]
    sd_change = max(last[s, "v2"]["max_within_sd_change"] for s in seeds)
    ratios = [last[s, "none"]["zero_evidence_min_variance_ratio"] for s in seeds]
    zero_ok = min(ratios) >= 1 - 1e-9
    arms = ["none", "nudge", "persistence", *E006_V2_ARMS]
    curve = {
        arm: [
            fmean(r["rmse_logit"] for r in rows if r["arm"] == arm and r["day"] == d)
            for d in range(1, E003_DAYS + 1)
        ]
        for arm in arms
    }
    secondary = {
        "day30_rmse_v2_minus_nudge": diff("v2", "nudge"),
        "day30_rmse_v2_minus_none": diff("v2", "none"),
        "never_observed_day30_rmse_v2_minus_none": diff("v2", "none", "rmse_logit_never_observed"),
        "day30_rmse_v2_walk_half_minus_persistence": diff("v2_walk_half", "persistence"),
        "day30_rmse_v2_walk_double_minus_persistence": diff("v2_walk_double", "persistence"),
    }
    metrics = {
        "primary_day30_rmse_v2_minus_persistence": {
            **primary,
            "verdict": "supported" if wins else "not supported",
        },
        **secondary,
        "day30_rmse_over_filter_sd_v2": {
            "n": len(calibration),
            "mean": fmean(calibration),
            "min": min(calibration),
            "max": max(calibration),
        },
        "day30_max_within_segment_sd_change_v2": sd_change,
        "zero_evidence_variance_does_not_shrink": {
            "passed": zero_ok,
            "min_variance_ratio": min(ratios),
        },
        "rmse_logit_by_day": curve,
    }
    verdict = metrics["primary_day30_rmse_v2_minus_persistence"]["verdict"]
    shown = [*range(0, E003_DAYS, 5), E003_DAYS - 1]
    by_day = "; ".join(
        f"day {d + 1}: " + " / ".join(f"{curve[a][d]:.3f}" for a in arms) for d in shown
    )
    report = [
        "- Primary, day-30 RMSE in logit, v2 minus persistence, paired by seed:"
        f" {_fmt(primary)}. Verdict: {verdict}; v2 wins only if the whole interval is below zero.",
        *(f"- {k.replace('_', ' ')}: {_fmt(m)}." for k, m in secondary.items()),
        "- Day-30 RMSE over v2's own predicted SD (1 is calibrated):"
        f" mean {fmean(calibration):.3f}, range {min(calibration):.3f} to"
        f" {max(calibration):.3f}, n = {len(calibration)}.",
        f"- Largest change in within-segment SD under v2 by day 30: {sd_change:.2e} logit.",
        "- Zero-evidence property (variance does not shrink with no observations):"
        f" {'pass' if zero_ok else 'fail'}, smallest variance ratio {min(ratios):.6f}.",
        f"- Mean RMSE in logit by day ({' / '.join(arms)}): {by_day}. Every day is in"
        " results.json.",
        "- Decision 0005: the daily default "
        + ("switches to v2 ('kalman')." if wins else "stays capped nudging ('nudge')."),
    ]
    segments = rows[0]["cells"] // E003_TOPICS
    deviations = [
        "None from the E006 plan. As in E003, segments are those present in a"
        f" {E003_AGENTS}-agent world ({segments} on seed {seeds[0]}), and the market aggregate"
        " is not generated.",
    ]
    return {
        "metrics": metrics,
        "n": len(seeds),
        "seeds": seeds,
        "rows": rows,
        "report": report,
        "deviations": deviations,
        "uses_llm": False,
        "cost_usd": 0.0,
    }


def run_e001_fixtures() -> Outcome:
    """E001 pipeline on the fixture questions: sim vs plain LLM vs a naive 0.5, scored by Brier."""
    protocol = score.load_protocol()
    with (forecast.FIXTURES / "outcomes.csv").open(newline="") as f:
        outcomes = {r["question_id"]: int(r["outcome"]) for r in csv.DictReader(f)}
    countries = {r["iso3"]: r for r in population.countries()}
    agents = population.sample_population(settings.WORLD_AGENTS, settings.WORLD_SEED)
    budget = llm.Budget(E001_COST_CAP_USD)
    conn = db.connect()
    rows = []
    for q in forecast.load_questions():
        if q["id"] not in outcomes:
            continue
        date, o = q["opens"], outcomes[q["id"]]
        first = countries[q["countries"][0]]
        sim = forecast.sim_forecast(conn, date, q, agents, budget)[0]
        plain = forecast.plain_llm_forecast(conn, date, q, budget)
        for name, p in (("sim", sim), ("plain_llm", plain), ("naive", NAIVE_PROBABILITY)):
            rows.append(
                {
                    "date": date,
                    "question_id": q["id"],
                    "forecaster": name,
                    "probability": p,
                    "outcome": o,
                    "tier": population.coverage_tier(first),
                    "region": first["region"],
                    "brier": score.brier(p, o),
                    "log_score": score.log_score(p, o, protocol["log_clip"]),
                }
            )
    b = protocol["bootstrap"]
    metrics: dict[str, Any] = {
        "primary_jsd_engine_minus_llm": {
            "status": "not computed",
            "reason": "fixture questions are binary forecasts, not Pew subgroup distributions",
        },
    }
    report = [
        "- Primary (Jensen-Shannon distance on Pew subgroup cells): not computed; fixture"
        " questions are binary forecasts, not Pew subgroup distributions."
    ]
    for name in ("sim", "plain_llm", "naive"):
        mine = [r for r in rows if r["forecaster"] == name]
        metrics[f"mean_brier_{name}"] = fmean(r["brier"] for r in mine)
        metrics[f"mean_log_score_{name}"] = fmean(r["log_score"] for r in mine)
        report.append(
            f"- {name}: mean Brier {metrics[f'mean_brier_{name}']:.4f}, mean log score"
            f" {metrics[f'mean_log_score_{name}']:.4f}, n = {len(mine)}."
        )
    for baseline in ("plain_llm", "naive"):
        pairs = score.paired_differences(rows, baseline)
        by_day: dict[str, list[float]] = {}
        for p in pairs:
            by_day.setdefault(p["date"], []).append(p["diff"])
        low, high = score.block_bootstrap(by_day, b["resamples"], b["seed"], b["interval"])
        m = {"n": len(pairs), "mean": fmean(p["diff"] for p in pairs), "low": low, "high": high}
        metrics[f"brier_sim_minus_{baseline}"] = m
        report.append(
            f"- Brier, sim minus {baseline}: {_fmt(m)}; below"
            f" {protocol['min_resolved_for_claims']} resolved questions no claim is allowed."
        )
    report.append(
        "- Spread ratio, sign agreement and the tier and region splits: not computed; they need"
        " subgroup distributions."
    )
    deviations = [
        "Fixture mode: the pre-registered data (Pew Spring 2026 crosstabs) does not exist yet,"
        " so this run scores the illustrative fixture questions with score.py. It tests the"
        " pipeline and supports no claim.",
        f"Each question is forecast once, on its opening date, from a {settings.WORLD_AGENTS}"
        "-agent world with no headlines ingested.",
    ]
    return {
        "metrics": metrics,
        "n": len(rows) // 3,
        "seeds": [settings.WORLD_SEED],
        "rows": rows,
        "report": report,
        "deviations": deviations,
        "uses_llm": True,
        "cost_usd": budget.spent_usd,
    }


PROTOCOLS: dict[str, Callable[[], Outcome]] = {"E003": run_e003, "E006": run_e006}
FIXTURE_PROTOCOLS: dict[str, Callable[[], Outcome]] = {"E001": run_e001_fixtures}


def git_commit() -> str:
    out = subprocess.run(
        ["git", "-C", str(REPO), "describe", "--always", "--dirty", "--abbrev=40"],
        capture_output=True,
        text=True,
        check=True,
    )
    return out.stdout.strip()


def protocol_for(exp_id: str, fixtures: bool) -> Callable[[], Outcome]:
    if fixtures and exp_id in FIXTURE_PROTOCOLS:
        return FIXTURE_PROTOCOLS[exp_id]
    if exp_id in PROTOCOLS:
        return PROTOCOLS[exp_id]
    if exp_id in MISSING:
        what, section = MISSING[exp_id]
        hint = (
            " `run E001 --fixtures` runs the pipeline on the fixture questions instead."
            if exp_id in FIXTURE_PROTOCOLS
            else ""
        )
        raise MissingInput(
            f"{exp_id} needs {what}, defined in experiments/{exp_id}/PREREG.md section"
            f" '## {section}'. It is not available, so nothing ran.{hint}"
        )
    raise MissingInput(f"{exp_id}: rw.experiments has no protocol for it")


def run(exp_id: str, fixtures: bool = False, root: Path = EXPERIMENTS, command: str = "") -> Path:
    """Check registration, run the protocol and write results/<UTC date>-<provider>/."""
    prereg = check_registration(exp_id, root)
    protocol = protocol_for(exp_id, fixtures)
    commit = git_commit()
    started = datetime.now(UTC)
    out = protocol()
    provider = llm.decider().name if out["uses_llm"] else "none"
    model = "none" if provider == "none" else llm.model_name()
    path = root / exp_id / "results" / f"{started.date().isoformat()}-{provider}"
    if path.exists():
        raise FileExistsError(f"{path} exists; results are never overwritten")
    path.mkdir(parents=True)

    meta = {
        "experiment": exp_id,
        "command": command
        or f"python -m rw.experiments run {exp_id}" + (" --fixtures" if fixtures else ""),
        "started_at": started.isoformat(timespec="seconds"),
        "git_commit": commit,
        "prereg_sha256": prereg,
        "engine_version": settings.ENGINE_VERSION,
        "provider": provider,
        "model": model,
        "cost_usd": out["cost_usd"],
        "n": out["n"],
        "seeds": out["seeds"],
    }
    results = {**meta, "metrics": out["metrics"], "deviations": out["deviations"]}
    (path / "results.json").write_text(json.dumps(results, indent=2) + "\n")
    with (path / "rows.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out["rows"][0]))
        w.writeheader()
        w.writerows(out["rows"])

    title = registry(root)[exp_id]["title"]
    lines = [f"# {exp_id} results: {title}", ""]
    if provider == "fake":
        lines += [FAKE_NOTE, ""]
    lines += [
        f"- Command: `{meta['command']}`",
        f"- Commit: `{commit}`",
        f"- PREREG.md sha256: `{prereg}` (matches REGISTRY.md)",
        f"- Engine {settings.ENGINE_VERSION}, provider {provider}, model {model}",
        f"- Cost: {llm.cost_text(out['cost_usd'], provider)}",
        f"- n = {out['n']}; raw rows in `rows.csv`, every number in `results.json`",
        "",
        "## Pre-registered metrics",
        "",
        *out["report"],
        "",
        "## Deviations from the pre-registration",
        "",
        *[f"- {d}" for d in out["deviations"]],
        "",
    ]
    (path / "RESULTS.md").write_text("\n".join(lines))
    return path


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m rw.experiments")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="list registered experiments and whether each can run")
    p = sub.add_parser("run", help="run one registered experiment")
    p.add_argument("id")
    p.add_argument("--fixtures", action="store_true", help="run on fixture data where supported")
    args = parser.parse_args(argv)

    if args.cmd == "list":
        for exp_id, row in registry().items():
            try:
                check_registration(exp_id)
                hashed = "hash ok"
            except NotRegistered:
                hashed = "hash mismatch"
            runs = (
                "runs"
                if exp_id in PROTOCOLS
                else "fixtures only"
                if exp_id in FIXTURE_PROTOCOLS
                else "data missing"
            )
            print(f"{exp_id}  {row['status']:<11} {hashed:<13} {runs:<13} {row['title']}")
        return 0
    try:
        command = "python -m rw.experiments " + " ".join(sys.argv[1:] if argv is None else argv)
        path = run(args.id, args.fixtures, command=command)
    except (NotRegistered, MissingInput, FileExistsError, llm.BudgetExceeded) as e:
        print(f"experiment refused, nothing written: {e}", file=sys.stderr)
        return 1
    print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""The daily cycle: eight re-runnable steps, each recorded in stage_runs and skipped once ok.

The only module that composes the others for a day (decision 0001, product/world.md).
"""

import argparse
import csv
import hashlib
import json
import sqlite3
import sys
from collections.abc import Callable, Sequence
from datetime import UTC, datetime
from datetime import date as Date
from functools import partial
from typing import Any
from urllib.parse import urlparse

import numpy as np

from rw import (
    beliefs,
    db,
    forecast,
    improve,
    ledger,
    llm,
    news,
    population,
    score,
    settings,
    sources,
)

STEPS = ("ingest", "assimilate", "forecast", "publish", "anchor", "score", "learn", "improve")
FIXTURE_DAYS = sorted(p.stem for p in (forecast.FIXTURES / "news").glob("*.csv"))
BIGGEST_MISSES = 5

Detail = dict[str, Any]
FIXTURE_ANCHOR = ledger.FIXTURE_ANCHOR


class NotAnchored(Exception):
    pass


def _now() -> str:
    # Milliseconds, so the calls of one step fall inside its window and no other step's.
    return datetime.now(UTC).isoformat(timespec="milliseconds")


def _seed(text: str) -> int:
    return int.from_bytes(hashlib.sha256(text.encode()).digest()[:8], "big")


def config_hash(version: str = "") -> str:
    values = {k: str(v) for k, v in vars(settings).items() if k.isupper()}
    if version:
        values["ENGINE_CONFIG_VERSION"] = version
    return ledger.sha256_hex(ledger.canonical_json(values))


def snapshot_sha256(date: str) -> str:
    return hashlib.sha256(population.snapshot_path(date).read_bytes()).hexdigest()


def previous_snapshot(date: str) -> str | None:
    found = (settings.rw_home() / "snapshots").glob("*/agents.parquet")
    return max((p.parent.name for p in found if p.parent.name < date), default=None)


def poll_error_sd(share: float, n: float) -> float:
    """Logit SD of a poll share: the sampling SD by the delta method times POLL_ERROR_FACTOR."""
    return settings.POLL_ERROR_FACTOR / float(np.sqrt(n * share * (1 - share)))


def ingest(
    conn: sqlite3.Connection, date: str, budget: llm.Budget, world_agents: int, live: bool = False
) -> Detail:
    news.ingest_day(conn, date, budget, live=live)
    n = conn.execute("SELECT count(DISTINCT cluster_id) FROM signals WHERE date = ?", (date,))
    return {"clusters": n.fetchone()[0], "news": "gdelt" if live else "fixtures"}


def assimilate(
    conn: sqlite3.Connection, date: str, budget: llm.Budget, world_agents: int
) -> Detail:
    prev = previous_snapshot(date)
    if prev is None:
        agents = population.sample_population(world_agents, settings.WORLD_SEED)
    else:
        agents = population.read_snapshot(prev)
    tps = population.topics()
    B = np.column_stack([agents[f"b_{t}"] for t in tps])
    B0 = np.column_stack([agents[f"b0_{t}"] for t in tps])
    prior_var = settings.KALMAN_PRIOR_SD_LOGIT**2
    C = np.column_stack([agents.get(f"c_{t}", np.zeros(len(B))) for t in tps])
    P = np.column_stack([agents.get(f"p_{t}", np.full(len(B), prior_var)) for t in tps])

    clusters: dict[str, Detail] = {}
    rows = conn.execute(
        "SELECT cluster_id, iso3, salience, topic, value FROM signals WHERE date = ?"
        " ORDER BY cluster_id",
        (date,),
    )
    for r in rows:
        c = clusters.setdefault(
            r["cluster_id"], {"iso3": r["iso3"], "salience": r["salience"], "signal": {}}
        )
        c["signal"][r["topic"]] = r["value"]

    # Clusters add up into one push per agent so the daily step cap and anchor pull apply once.
    push = np.zeros_like(B)
    exposed = np.zeros(len(B), dtype=bool)
    rng = np.random.default_rng(_seed(f"assimilate|{date}"))
    for c in clusters.values():
        idx = np.flatnonzero(agents["country"] == c["iso3"])
        hit = news.exposure(agents["age_band"][idx], c["iso3"], c["salience"], 0, rng)
        push[idx[hit]] += np.array([c["signal"][t] for t in tps])
        exposed[idx[hit]] = True
    B = beliefs.update_beliefs(B, B0 + C, agents["s"], push, exposed)

    observed = conn.execute(
        "SELECT iso3, topic, SUM(share * n) / SUM(n), SUM(n) FROM observations WHERE date = ?"
        " GROUP BY iso3, topic",
        (date,),
    ).fetchall()
    if settings.ASSIMILATION == "kalman":
        targets = {
            (iso3, tps.index(topic)): (share, poll_error_sd(share, n))
            for iso3, topic, share, n in observed
        }
        B, C, P, nudges = beliefs.kalman_update(B, C, P, agents["country"], targets)
        for j, t in enumerate(tps):
            agents[f"c_{t}"] = C[:, j]
            agents[f"p_{t}"] = P[:, j]
    elif settings.ASSIMILATION == "nudge":
        shares = {(iso3, tps.index(topic)): share for iso3, topic, share, _ in observed}
        B, nudges = beliefs.nudge(B, agents["country"], shares)
    else:
        raise ValueError(f"settings.ASSIMILATION is {settings.ASSIMILATION!r}, not nudge or kalman")

    for j, t in enumerate(tps):
        agents[f"b_{t}"] = B[:, j]
    sha = population.write_snapshot(date, agents)
    with conn:
        conn.executemany(
            "INSERT OR IGNORE INTO nudges (date, iso3, topic, wanted, applied)"
            " VALUES (?, ?, ?, ?, ?)",
            [(date, n.group_id, tps[n.topic_index], n.wanted, n.applied) for n in nudges],
        )
    return {
        "from": prev or "fresh sample",
        "agents": len(B),
        "exposed": int(exposed.sum()),
        "nudges": len(nudges),
        "snapshot_sha256": sha,
    }


def forecast_step(
    conn: sqlite3.Connection,
    date: str,
    budget: llm.Budget,
    world_agents: int,
    questions: str = "fixtures",
) -> Detail:
    forecast.forecast_day(conn, date, population.read_snapshot(date), budget, questions)
    n = conn.execute("SELECT count(*) FROM forecasts WHERE date = ?", (date,)).fetchone()[0]
    return {"forecasts": n}


def day_entries(conn: sqlite3.Connection, date: str, questions: str = "fixtures") -> list[Detail]:
    """The 0002 entries for a day, built only from stored rows so a rerun gives the same bytes."""
    entries: list[Detail] = []
    protocol = score.protocol_hash()
    prev = conn.execute(
        "SELECT protocol_hash FROM ledger_days WHERE date < ? ORDER BY date DESC LIMIT 1", (date,)
    ).fetchone()
    if prev is None or prev[0] != protocol:
        entries.append(
            {
                "kind": "protocol",
                "date": date,
                "protocol_hash": protocol,
                "engine_version": settings.ENGINE_VERSION,
            }
        )

    sets = forecast.question_sets(questions)
    by_id = {q["id"]: q for _, qs in sets for q in qs}
    for set_hash, qs in sets:
        seen = conn.execute(
            "SELECT 1 FROM ledger_leaves WHERE date < ? AND json_extract(entry_json, '$.kind') ="
            " 'question_set' AND json_extract(entry_json, '$.question_set_hash') = ?",
            (date, set_hash),
        ).fetchone()
        if seen is None:
            entries.append(
                {
                    "kind": "question_set",
                    "date": date,
                    "question_set_hash": set_hash,
                    "question_ids": sorted(q["id"] for q in qs),
                    "engine_version": settings.ENGINE_VERSION,
                }
            )

    entries.extend(improve.unrecorded(conn, date))
    current = improve.active(conn, date)
    common = {
        "engine_version": settings.ENGINE_VERSION,
        "config_hash": config_hash(current["version"]),
        "snapshot_sha256": snapshot_sha256(date),
        "supersedes": "",
    }
    rows = conn.execute(
        "SELECT * FROM forecasts WHERE date = ? ORDER BY question_id, forecaster", (date,)
    )
    for r in rows:
        q = by_id[r["question_id"]]
        p = r["probability"]
        if r["forecaster"] == "sim" and current["version"]:
            p = improve.apply_map(current["params"], p)
        entries.append(
            {
                "kind": "forecast",
                "date": date,
                "question_id": q["id"],
                "question_hash": forecast.question_hash(q),
                "forecaster": r["forecaster"],
                "probability": ledger.prob_str(p),
                "market_price_at_commit": ledger.prob_str(r["market_price_at_commit"]),
                "market_source": q["market_source"],
                "committed_at": r["created_at"].replace("+00:00", "Z"),
                "model": r["model"] or "",
                **common,
            }
        )
    return entries


def publish(
    conn: sqlite3.Connection,
    date: str,
    budget: llm.Budget,
    world_agents: int,
    questions: str = "fixtures",
) -> Detail:
    out = ledger.commit_day(conn, date, day_entries(conn, date, questions), score.protocol_hash())
    return {
        "leaves": int(out["day"]["leaf_count"]),
        "root": out["day"]["root"],
        "receipt": str(ledger.export_day(conn, date)),
    }


def anchor(conn: sqlite3.Connection, date: str, budget: llm.Budget, world_agents: int) -> Detail:
    if ledger.is_fixture(ledger.entries(conn, date)):
        return {"skipped": FIXTURE_ANCHOR}
    failures = (
        [] if ledger.anchor_status(conn, date)[0] == "anchored" else ledger.anchor_day(conn, date)
    )
    status, at = ledger.anchor_status(conn, date)
    if status != "anchored":
        raise NotAnchored("; ".join(failures) or "no proof stored")
    return {"status": status, "at": at, "failures": failures}


def score_step(
    conn: sqlite3.Connection, date: str, budget: llm.Budget, world_agents: int
) -> Detail:
    with (forecast.FIXTURES / "outcomes.csv").open(newline="") as f:
        outcomes = [r for r in csv.DictReader(f) if r["resolved_on"] <= date]
    recorded = {r[0] for r in conn.execute("SELECT question_id FROM resolutions")}
    for o in outcomes:
        if o["question_id"] not in recorded:
            score.record_resolution(
                conn, o["question_id"], int(o["outcome"]), o["resolved_on"], o["source_url"], date
            )

    resolved = dict(
        conn.execute("SELECT question_id, outcome FROM resolutions WHERE resolved_on <= ?", (date,))
    )
    rows = []
    for (day,) in conn.execute("SELECT date FROM ledger_days WHERE date <= ?", (date,)).fetchall():
        for leaf in ledger.entries(conn, day):
            e = leaf["entry"]
            if e["kind"] == "forecast" and e["question_id"] in resolved:
                rows.append(
                    {
                        "date": e["date"],
                        "question_id": e["question_id"],
                        "forecaster": e["forecaster"],
                        "probability": float(e["probability"]),
                        "outcome": resolved[e["question_id"]],
                    }
                )
    score.write_scores(conn, rows)
    return {"resolved": len(resolved), "scored_rows": len(rows)}


def learn(conn: sqlite3.Connection, date: str, budget: llm.Budget, world_agents: int) -> Detail:
    sources.require(population.SOURCE_ID)
    tps = population.topics()
    with (population.SAMPLE / "attitudes.csv").open(newline="") as f:
        survey_sd = {
            (r["iso3"], tps.index(r["topic"])): float(r["survey_sd_logit"])
            for r in csv.DictReader(f)
        }
    agents = population.read_snapshot(date)
    B = np.column_stack([agents[f"b_{t}"] for t in tps])
    audit = beliefs.spread_audit(B, agents["country"], survey_sd)

    tiers = {r["iso3"]: population.coverage_tier(r) for r in population.countries()}
    out_of_band = {a.country for a in audit if not a.in_band}
    present = sorted({a.country for a in audit})
    misses = conn.execute(
        "SELECT date, question_id, brier FROM scores WHERE forecaster = 'sim' AND date <= ?"
        " ORDER BY brier DESC, date, question_id LIMIT ?",
        (date, BIGGEST_MISSES),
    ).fetchall()
    with conn:
        conn.executemany(
            "INSERT OR IGNORE INTO audits (date, iso3, topic, sim_sd, survey_sd, ratio, in_band)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                (date, a.country, tps[a.topic_index], a.sim_sd, a.survey_sd, a.ratio, a.in_band)
                for a in audit
            ],
        )
        conn.executemany(
            "INSERT OR IGNORE INTO country_status (date, iso3, tier, experimental)"
            " VALUES (?, ?, ?, ?)",
            [(date, c, tiers[c], c in out_of_band) for c in present],
        )
    return {
        "experimental": sorted(out_of_band),
        "biggest_misses": [dict(m) for m in misses],
    }


def improve_step(
    conn: sqlite3.Connection, date: str, budget: llm.Budget, world_agents: int
) -> Detail:
    """Fit, test and maybe promote a recalibration map; any failure keeps the incumbent."""
    scored = conn.execute(
        "SELECT 1 FROM stage_runs WHERE date = ? AND step = 'score' AND status = 'ok'", (date,)
    ).fetchone()
    if scored is None:
        raise RuntimeError(f"{date} is not scored, so the incumbent engine version stays")
    rows = conn.execute(
        "SELECT f.date, f.question_id, f.probability AS raw, r.outcome, r.resolved_on"
        " FROM forecasts f JOIN resolutions r USING (question_id)"
        " WHERE f.forecaster = 'sim' AND r.resolved_on <= ? AND f.date <= r.resolved_on",
        (date,),
    ).fetchall()
    incumbent = improve.active(conn, improve.next_day(date))
    decision = improve.evaluate([dict(r) for r in rows], incumbent)
    detail = {k: v for k, v in decision.items() if k != "candidate"}
    detail["incumbent"] = incumbent["version"] or "identity"
    if decision["promote"]:
        detail["promoted"] = improve.promote(conn, date, decision)
    return detail


STEP_FUNCS: dict[str, Callable[..., Detail]] = {
    "ingest": ingest,
    "assimilate": assimilate,
    "forecast": forecast_step,
    "publish": publish,
    "anchor": anchor,
    "score": score_step,
    "learn": learn,
    "improve": improve_step,
}


def drop_old_step_check(conn: sqlite3.Connection) -> None:
    """A stage_runs made before the anchor step has a CHECK on step that refuses it, and CREATE
    TABLE IF NOT EXISTS cannot drop it, so such a table is rebuilt with its rows."""
    old = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'stage_runs'"
    ).fetchone()
    if old is None or "CHECK (step" not in old[0]:
        return
    cols = "date, step, status, started_at, finished_at, detail"
    conn.executescript(
        "BEGIN; ALTER TABLE stage_runs RENAME TO stage_runs_old;"
        + (db.SQL_DIR / "daily.sql").read_text()
        + f"INSERT INTO stage_runs ({cols}) SELECT {cols} FROM stage_runs_old;"
        " DROP TABLE stage_runs_old; COMMIT;"
    )


def _finish(conn: sqlite3.Connection, date: str, step: str, status: str, detail: Detail) -> None:
    with conn:
        conn.execute(
            "UPDATE stage_runs SET status = ?, finished_at = ?, detail = ?"
            " WHERE date = ? AND step = ?",
            (status, _now(), json.dumps(detail), date, step),
        )


def run(
    date: str,
    steps: Sequence[str] | None = None,
    world_agents: int = settings.WORLD_AGENTS,
    live_news: bool = False,
    questions: str = "fixtures",
) -> Detail:
    """Run the named steps (default all) for date, skipping any already ok; return a summary.

    Any failure, including BudgetExceeded, marks the step failed and stops the run, except in
    anchor: it records what already happened, so score and learn still run; a rerun retries it.
    A failed improve keeps the incumbent engine version and the run goes on."""
    conn = db.connect()
    drop_old_step_check(conn)
    calls_before = conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]
    budget = llm.Budget(settings.NIGHTLY_BUDGET_USD - llm.spent_today(conn))
    spent_before = budget.spent_usd
    done = {
        r[0]
        for r in conn.execute(
            "SELECT step FROM stage_runs WHERE date = ? AND status = 'ok'", (date,)
        )
    }
    funcs = {
        **STEP_FUNCS,
        "ingest": partial(ingest, live=live_news),
        "forecast": partial(STEP_FUNCS["forecast"], questions=questions),
        "publish": partial(STEP_FUNCS["publish"], questions=questions),
    }
    ran = []
    for step in steps or STEPS:
        if step in done:
            continue
        with conn:
            conn.execute(
                "INSERT INTO stage_runs (date, step, status, started_at)"
                " VALUES (?, ?, 'running', ?)"
                " ON CONFLICT (date, step) DO UPDATE SET status = 'running',"
                " started_at = excluded.started_at, finished_at = NULL, detail = NULL",
                (date, step, _now()),
            )
        try:
            detail = funcs[step](conn, date, budget, world_agents)
        except BaseException as e:
            _finish(conn, date, step, "failed", {"error": f"{type(e).__name__}: {e}"})
            if step in ("anchor", "improve") and isinstance(e, Exception):
                continue
            raise
        _finish(conn, date, step, "ok", detail)
        ran.append(step)
    return summary(conn, date, ran, calls_before, budget.spent_usd - spent_before)


def summary(
    conn: sqlite3.Connection, date: str, ran: list[str], calls_before: int, usd: float
) -> Detail:
    day = conn.execute("SELECT root FROM ledger_days WHERE date = ?", (date,)).fetchone()
    forecasts = sum(e["entry"]["kind"] == "forecast" for e in ledger.entries(conn, date))
    scored = conn.execute(
        "SELECT count(DISTINCT question_id) FROM scores JOIN resolutions USING (question_id)"
        " WHERE resolved_on <= ?",
        (date,),
    )
    experimental = conn.execute(
        "SELECT iso3 FROM country_status WHERE date = ? AND experimental = 1 ORDER BY iso3", (date,)
    )
    return {
        "date": date,
        "ran": ran,
        "model_calls": conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0] - calls_before,
        "usd": usd,
        "model": llm.model_name(),
        "forecasts_committed": forecasts,
        "root": day["root"] if day else None,
        "questions_scored": scored.fetchone()[0],
        "experimental": [r[0] for r in experimental],
        "anchor": anchor_line(conn, date),
    }


def anchor_line(conn: sqlite3.Connection, date: str) -> str:
    status, at = ledger.anchor_status(conn, date)
    if status == "anchored":
        tsa = next(a["service"] for a in ledger.anchors(conn, date) if a["kind"] == "rfc3161")
        when = (at or "").replace("T", " ").replace("Z", " UTC")
        return f"Anchored {when} by {urlparse(tsa).hostname}"
    if status == "pending":
        return "Anchor pending: OpenTimestamps proof awaits a Bitcoin block"
    row = conn.execute(
        "SELECT detail FROM stage_runs WHERE date = ? AND step = 'anchor'", (date,)
    ).fetchone()
    detail = json.loads(row["detail"] or "{}") if row else {}
    return f"Not anchored: {detail.get('skipped') or detail.get('error') or 'anchor step not run'}"


def format_summary(s: Detail) -> str:
    cost = llm.cost_text(s["usd"], s["model"])
    return (
        f"{s['date']}  Steps run: {', '.join(s['ran']) or 'none'}\n"
        f"  Model calls: {s['model_calls']}, forecasts committed: {s['forecasts_committed']}, "
        f"root: {s['root']}\n"
        f"  Cost: {cost}\n"
        f"  Questions scored: {s['questions_scored']}, "
        f"experimental: {', '.join(s['experimental']) or 'none'}\n"
        f"  {s['anchor']}"
    )


def valid_date(text: str) -> bool:
    try:
        return Date.fromisoformat(text).isoformat() == text
    except ValueError:
        return False


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m rw.daily")
    which = parser.add_mutually_exclusive_group(required=True)
    which.add_argument("--date", help="YYYY-MM-DD")
    which.add_argument("--fixtures", action="store_true", help="run every fixture day in order")
    parser.add_argument("--step", choices=STEPS, help="run only this step")
    parser.add_argument(
        "--news", choices=("fixtures", "live"), default="fixtures", help="live reads GDELT"
    )
    parser.add_argument(
        "--questions",
        choices=("fixtures", "live"),
        default="fixtures",
        help="live reads the approved lists in data/questions",
    )
    args = parser.parse_args(argv)
    if args.date is not None and not valid_date(args.date):
        print(f"{args.date} is not a date; use YYYY-MM-DD", file=sys.stderr)
        return 2
    if args.fixtures and args.news == "live":
        parser.error("--news live needs --date")
    if args.fixtures and args.questions == "live":
        parser.error("--questions live needs --date")
    try:
        forecast.load_questions(args.questions)
    except forecast.ListNotApproved as e:
        print(f"question list refused, nothing ran: {e}", file=sys.stderr)
        return 1

    dates = FIXTURE_DAYS if args.fixtures else [str(args.date)]
    steps = [args.step] if args.step else None
    try:
        for date in dates:
            out = run(date, steps, live_news=args.news == "live", questions=args.questions)
            print(format_summary(out))
    except llm.BudgetExceeded as e:
        print(f"budget exceeded, run stopped: {e}", file=sys.stderr)
        return 1
    except news.NewsUnavailable as e:
        print(f"no news, run stopped before forecasting: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

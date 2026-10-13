"""Replay a day's forecasts from the model outputs stored in llm_calls, with no model call.

Each prompt is rebuilt from the day's snapshot and signals exactly as forecast.py built it and
looked up by hash, because llm_calls.at is when the call ran, not the cycle date it served.
The committed values come from the ledger, never from the forecasts table (product/world.md).
"""

import hashlib
import json
import sqlite3
from collections.abc import Callable
from typing import Any

import numpy as np

from rw import forecast, ledger, llm, population, settings
from rw.forecast import Question

REPLAYED = ("sim", "plain_llm")


def _recorded(
    conn: sqlite3.Connection,
    purpose: str,
    state: str,
    questions: llm.Questions,
    share: Callable[[dict[str, Any]], float],
    provider: str | None,
) -> tuple[int, float] | None:
    """(call id, yes share) of the earliest stored answer to the request, as the memo reads it."""
    request = llm.decide_request(state, questions)
    row = conn.execute(
        "SELECT id, output_json FROM llm_calls WHERE purpose = ? AND prompt_sha256 = ?"
        " AND output_json IS NOT NULL AND (? IS NULL OR provider = ?) ORDER BY id LIMIT 1",
        (purpose, hashlib.sha256(request.encode()).hexdigest(), provider, provider),
    ).fetchone()
    return None if row is None else (row["id"], share(json.loads(row["output_json"])))


def segment_answers(
    conn: sqlite3.Connection,
    date: str,
    question: Question,
    agents: population.Agents | None = None,
    provider: str | None = None,
) -> list[dict[str, Any]]:
    """One row per segment asked: description, the prior share it was told, the recorded yes
    share and the llm_calls id; the last two are None when no answer was recorded."""
    agents = population.read_snapshot(date) if agents is None else agents
    _, asks = forecast.sim_inputs(conn, date, question, agents)
    out = []
    for segment, _, share, prompt in asks:
        found = _recorded(
            conn,
            "forecast_sim",
            prompt,
            forecast.sim_questions(date, question, segment),
            forecast.sim_share,
            provider,
        )
        out.append(
            {
                "segment": segment,
                "description": forecast.segment_text(segment),
                "prior_share": share,
                "yes_share": None if found is None else found[1],
                "call_id": None if found is None else found[0],
            }
        )
    return out


def plain_samples(
    conn: sqlite3.Connection, date: str, question: Question, provider: str | None = None
) -> list[float]:
    """The recorded plain-LLM yes shares in sample order; a sample with no record is skipped."""
    return [found[1] for found in _plain_calls(conn, date, question, provider) if found]


def _plain_calls(
    conn: sqlite3.Connection, date: str, question: Question, provider: str | None
) -> list[tuple[int, float] | None]:
    titles = forecast.headlines(conn, date, question["countries"])
    return [
        _recorded(
            conn,
            "forecast_plain",
            forecast.plain_prompt(question, titles, i),
            forecast.PLAIN_QUESTIONS,
            forecast.plain_share,
            provider,
        )
        for i in range(settings.PLAIN_LLM_SAMPLES)
    ]


def replay_forecast(
    conn: sqlite3.Connection,
    date: str,
    question: Question,
    agents: population.Agents,
    provider: str | None = None,
) -> dict[str, Any]:
    """The sim probability, p10 and p90 and the plain-LLM mean recomputed from recorded answers
    with the same seed and bootstrap as forecast.sim_forecast. A value is None when any call it
    needs is not recorded; call_ids lists every recorded call it used."""
    segments = segment_answers(conn, date, question, agents, provider)
    plain = _plain_calls(conn, date, question, provider)
    sim = None
    if all(s["call_id"] is not None for s in segments):
        offsets, asks = forecast.sim_inputs(conn, date, question, agents)
        logits = np.empty(len(offsets))
        for (_, mask, _, _), s in zip(asks, segments, strict=True):
            logits[mask] = forecast.segment_logit(s["yes_share"])
        sim = forecast.sim_summary(date, question["id"], logits, offsets)
    return {
        "sim": sim,
        "plain_llm": None if None in plain else forecast.plain_mean([p[1] for p in plain if p]),
        "segments": segments,
        "call_ids": [s["call_id"] for s in segments if s["call_id"] is not None]
        + [p[0] for p in plain if p],
    }


def _find_question(question_id: str) -> Question | None:
    for which in ("fixtures", "live"):
        try:
            found = next(
                (q for q in forecast.load_questions(which) if q["id"] == question_id), None
            )
        except forecast.ListNotApproved:
            continue
        if found is not None:
            return found
    return None


def replay_day(conn: sqlite3.Connection, date: str) -> dict[str, Any]:
    """Replay every committed sim and plain_llm forecast of the day against its ledger entry."""
    agents = population.read_snapshot(date)
    committed = [
        e["entry"]
        for e in ledger.entries(conn, date)
        if e["entry"]["kind"] == "forecast" and e["entry"]["forecaster"] in REPLAYED
    ]
    committed.sort(key=lambda e: (e["question_id"], e["forecaster"]))
    cache: dict[str, dict[str, Any] | None] = {}
    texts: dict[str, str | None] = {}
    rows, missing = [], []
    for e in committed:
        qid = e["question_id"]
        if qid not in cache:
            q = _find_question(qid)
            provider = llm.provider_for(e["model"])
            texts[qid] = None if q is None else q["text"]
            cache[qid] = None if q is None else replay_forecast(conn, date, q, agents, provider)
        r = cache[qid]
        value = None if r is None else r[e["forecaster"]]
        replayed = None if value is None else (value[0] if e["forecaster"] == "sim" else value)
        shown = None if replayed is None else float(ledger.prob_str(replayed))
        was = float(e["probability"])
        rows.append(
            {
                "question_id": qid,
                "question": texts[qid],
                "forecaster": e["forecaster"],
                "committed": was,
                "replayed": shown,
                "low": value[1] if e["forecaster"] == "sim" and value else None,
                "high": value[2] if e["forecaster"] == "sim" and value else None,
                "diff": None if shown is None else round(shown - was, 4),
                "matches": replayed is not None and ledger.prob_str(replayed) == e["probability"],
            }
        )
        if replayed is None and qid not in missing:
            missing.append(qid)
    calls = {c for r in cache.values() if r for c in r["call_ids"]}
    return {"date": date, "forecasts": rows, "calls_used": len(calls), "missing": missing}

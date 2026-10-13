"""GET /v1/status: the live system status strip, read from the ledger, stage_runs and llm_calls."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from rw import ledger, llm, settings

router = APIRouter()


class SystemStatus(BaseModel):
    date: str | None
    cycle_finished_at: str | None
    cycle_status: Literal["ok", "failed", "running", "not_run"]
    root: str | None
    record_hash: str | None
    anchor: ledger.AnchorStatus | None
    anchored_at: str | None
    model: str
    provider: str
    spent_today_usd: float
    nightly_budget_usd: float
    engine_version: str


@router.get("/v1/status", summary="Live system status", response_model=SystemStatus)
def status() -> SystemStatus:
    from rw_api.app import connect  # app imports this module, so the import waits for a request

    conn = connect()
    row = conn.execute("SELECT max(date) FROM stage_runs").fetchone()
    day = row[0] or conn.execute("SELECT max(date) FROM ledger_days").fetchone()[0]
    stages = (
        conn.execute("SELECT status, finished_at FROM stage_runs WHERE date = ?", (day,)).fetchall()
        if day
        else []
    )
    states = {s["status"] for s in stages}
    cycle = (
        "failed"
        if "failed" in states
        else "running"
        if "running" in states
        else "ok"
        if states
        else "not_run"
    )
    finished = max((s["finished_at"] for s in stages if s["finished_at"]), default=None)
    ledger_day = (
        conn.execute("SELECT root, record_hash FROM ledger_days WHERE date = ?", (day,)).fetchone()
        if day
        else None
    )
    anchor, anchored_at = ledger.anchor_status(conn, day) if ledger_day else (None, None)
    return SystemStatus(
        date=day,
        cycle_finished_at=finished,
        cycle_status=cycle,
        root=ledger_day["root"] if ledger_day else None,
        record_hash=ledger_day["record_hash"] if ledger_day else None,
        anchor=anchor,
        anchored_at=anchored_at,
        model=llm.model_name(),
        provider=llm.decider().name,
        spent_today_usd=llm.spent_today(conn),
        nightly_budget_usd=settings.NIGHTLY_BUDGET_USD,
        engine_version=settings.ENGINE_VERSION,
    )

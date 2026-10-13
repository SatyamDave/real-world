"""One receipt with its Merkle inclusion proof (product/receipts.md)."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from rw import ledger

# Defined first: `python -m rw_api.app` imports this module from a second copy of app.
router = APIRouter()

from rw_api import app as api  # noqa: E402


class ProofStep(BaseModel):
    position: str
    hash: str


class LeafReceipt(BaseModel):
    day: api.DayRecord
    record_hash: str
    entry: dict[str, Any]
    salt: str
    leaf_hash: str
    proof: list[ProofStep]
    root: str
    question: api.ReceiptQuestion | None
    outcome: int | None
    brier: float | None
    anchor: ledger.AnchorStatus
    anchored_at: str | None


@router.get(
    "/v1/receipts/{day}/leaves/{leaf_hash}",
    summary="One receipt with its inclusion proof up to the day's root",
    response_model=LeafReceipt,
    responses={404: api.not_found("receipt"), 422: api.INVALID},
)
def receipt_leaf(day: str, leaf_hash: str) -> LeafReceipt:
    receipt = api.receipt_day(day)
    leaves = [e.leaf_hash for e in receipt.entries]
    item = next((e for e in receipt.entries if e.leaf_hash == leaf_hash), None)
    if item is None:
        raise HTTPException(404, f"no receipt {leaf_hash} on {day}")
    return LeafReceipt(
        day=receipt.day.model_dump(),  # type: ignore[arg-type]  # tests reload app, so the class differs
        record_hash=receipt.record_hash,
        proof=[ProofStep(**s) for s in ledger.inclusion_proof(leaves, leaf_hash)],
        root=receipt.day.root,
        anchor=receipt.anchor,
        anchored_at=receipt.anchored_at,
        **item.model_dump(),
    )

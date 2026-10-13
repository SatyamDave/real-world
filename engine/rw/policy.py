"""The acceptable-use screen for fork events (product/acceptable-use.md): a rule pass, then one
model classification. The API runs it before a fork is queued, so a refused event spends nothing
on the fork."""

import re
import sqlite3
from datetime import UTC, date, datetime
from typing import Literal

from pydantic import BaseModel

from rw import llm, settings

Code = Literal["private_person", "election_persuasion", "election_window"]


class PolicyRefused(BaseModel):
    code: Code
    detail: str


DETAIL: dict[str, str] = {
    "private_person": "The event names a private person. Real World simulates groups, never"
    " real private people.",
    "election_persuasion": "The event tests persuasion on voters or a candidate. Real World does"
    " not test political messages.",
    "election_window": "Until {end}, events that name a party, candidate or ballot measure are"
    " refused around the US midterm elections on 2026-11-03.",
}

# ponytail: naive patterns; the classifier below catches what they miss, tune both from the log.
PRIVATE_PERSON = re.compile(
    r"[\w.+-]+@[\w-]+\.\w+"
    r"|(?<![\w@])@\w{2,}"
    r"|\b[Mm]y\s+(?:neighbou?r|boss|manager|co-?worker|colleague|friend|ex|wife|husband|partner"
    r"|teacher|landlord|tenant|sister|brother|mother|father|mom|mum|dad|son|daughter|cousin)"
    r"\s+[A-Z][a-z]+",
)
PERSUASION = re.compile(
    r"\bwhich\s+(?:message|slogan|ad|framing|pitch|talking point)s?\b[^.]{0,80}"
    r"\b(?:voters?|votes?|support|election|candidate|campaign|works best|wins|persuades?)\b"
    r"|\b(?:message|ad|slogan)\s+(?:variants?|a/b test)"
    r"|\b(?:persuade|convince|win over|sway)\b[^.]{0,40}\b(?:undecided|swing|likely)\s+voters\b"
    r"|\b(?:shift|move|swing|win|flip|sway)\w*\s+(?:(?:the|more|most|many|enough)\s+)*"
    r"(?:votes?|voters?|support)\s+(?:to|toward|towards|for)\b"
    r"|\bour\s+(?:campaign|candidate|ad|message|slogan)\b",
    re.IGNORECASE,
)
ELECTION_TERMS = re.compile(
    r"\b(?:democrats?|democratic party|republicans?|republican party|GOP|DNC|RNC"
    r"|libertarian party|green party|candidates?|ballot (?:measure|initiative|question)s?"
    r"|prop(?:osition)?\s+\d+|referend(?:um|a)|midterms?|primary election|primaries|senate race"
    r"|house race|governor'?s race)\b",
    re.IGNORECASE,
)

SCHEMA = {
    "type": "object",
    "properties": {
        "rule": {"enum": ["none", "private_person", "election_persuasion"]},
        "quote": {"type": "string"},
        "election_name": {"type": "string"},
    },
    "required": ["rule", "quote", "election_name"],
    "additionalProperties": False,
}


def _prompt(text: str) -> str:
    return (
        "You screen events that people drop into a simulation of a synthetic population.\n"
        "rule: private_person if the event names a real private individual (not a public figure);"
        " election_persuasion if it tests which message, ad or framing persuades voters, or how to"
        " move support for a candidate or ballot measure; otherwise none.\n"
        "quote: the exact words from the event that break the rule, or an empty string.\n"
        "election_name: the exact words from the event that name a political party, candidate or"
        " ballot measure, or an empty string.\n"
        f"Event:\n{text}"
    )


def _in(span: str, text: str) -> bool:
    # A span the model did not copy from the event is not evidence, so it cannot refuse.
    span = span.strip().lower()
    return bool(span) and span in text.lower()


def screen(
    text: str,
    conn: sqlite3.Connection,
    today: date | None = None,
    budget: llm.Budget | None = None,
) -> PolicyRefused | None:
    """Return why the event is refused, or None if it may run. A classifier call that cannot run
    raises (llm.BudgetExceeded, ValueError, a provider error); the caller refuses on it. Pass
    budget, limited to SCREEN_MAX_COST_USD, to read what the call spent, even if it raises."""
    today = today or datetime.now(UTC).date()
    start, end = settings.ELECTION_WINDOW
    in_window = start <= today <= end

    def refuse(code: Code) -> PolicyRefused:
        return PolicyRefused(code=code, detail=DETAIL[code].format(end=end.isoformat()))

    if PRIVATE_PERSON.search(text):
        return refuse("private_person")
    if PERSUASION.search(text):
        return refuse("election_persuasion")
    if in_window and ELECTION_TERMS.search(text):
        return refuse("election_window")

    out = llm.complete_json(
        "screen",
        _prompt(text),
        SCHEMA,
        budget or llm.Budget(settings.SCREEN_MAX_COST_USD),
        max_tokens=settings.SCREEN_MAX_OUTPUT_TOKENS,
        conn=conn,
    )
    if out["rule"] != "none" and _in(out["quote"], text):
        return refuse(out["rule"])
    if in_window and _in(out["election_name"], text):
        return refuse("election_window")
    return None

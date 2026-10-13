import json
from datetime import date

import pytest

from rw import db, llm, policy, settings

OUTSIDE = date(2026, 10, 12)
INSIDE = date(2026, 11, 3)


@pytest.fixture(autouse=True)
def isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))


@pytest.fixture
def conn():
    return db.connect()


class Stub:
    name = "stub"

    def __init__(self, rule="none", quote="", election_name=""):
        self.out = json.dumps({"rule": rule, "quote": quote, "election_name": election_name})

    def complete(self, prompt, schema, max_tokens):
        return self.out, 50, 20


def stub(monkeypatch, **out):
    monkeypatch.setattr(llm, "provider", lambda: Stub(**out))


def rows(conn):
    return conn.execute("SELECT count(*) FROM llm_calls").fetchone()[0]


def code(text, conn, today=OUTSIDE):
    refused = policy.screen(text, conn, today)
    return None if refused is None else refused.code


@pytest.mark.parametrize(
    "text",
    [
        "Email jane.doe@example.com tells her street prices rose.",
        "@janedoe42 loses her job at the plant.",
        "my neighbour Priya wins the lottery.",
        "My boss Tom cuts everyone's pay by a third.",
    ],
)
def test_rule_refuses_a_named_private_person_without_a_model_call(conn, text):
    assert code(text, conn) == "private_person"
    assert rows(conn) == 0


@pytest.mark.parametrize(
    "text",
    [
        "Which message on taxes persuades voters in Ohio most?",
        "Test three ad variants on immigration in swing states.",
        "Our candidate promises free childcare.",
        "Convince undecided voters that the bridge plan is a scam.",
        "Find the message that shifts the most votes to the Labour candidate"
        " in the marginal seats.",
        "How do we shift votes toward Senator Smith in the swing states?",
        "Which slogan wins more support for the transit levy?",
    ],
)
def test_rule_refuses_election_persuasion_without_a_model_call(conn, text):
    assert code(text, conn) == "election_persuasion"
    assert rows(conn) == 0


def test_rule_lets_a_shift_in_spending_through(conn):
    assert code("A new tax shifts spending toward housing.", conn) is None


@pytest.mark.parametrize(
    "text",
    [
        "Republicans win control of the House.",
        "Ballot measure caps rent increases at 3 percent.",
        "Proposition 33 passes in California.",
        "A third-party candidate surges in the polls.",
    ],
)
def test_election_window_refuses_parties_candidates_and_ballot_measures(conn, text):
    assert code(text, conn, INSIDE) == "election_window"
    assert rows(conn) == 0
    assert code(text, conn, OUTSIDE) is None


def test_window_bounds_are_inclusive(conn):
    start, end = settings.ELECTION_WINDOW
    text = "Democrats propose a carbon tax."
    for day in (start, end):
        assert code(text, conn, day) == "election_window"
    assert code(text, conn, date.fromordinal(end.toordinal() + 1)) is None


def test_an_ordinary_event_passes_with_one_screen_call_on_the_fake_model(conn):
    text = "A chip shortage doubles phone prices worldwide."
    assert code(text, conn, INSIDE) is None
    rows_ = conn.execute("SELECT purpose, provider FROM llm_calls").fetchall()
    assert [tuple(r) for r in rows_] == [("screen", "fake")]
    assert code(text, conn, INSIDE) is None
    assert rows(conn) == 1


def test_classifier_refuses_on_a_quote_from_the_event(conn, monkeypatch):
    stub(monkeypatch, rule="private_person", quote="Jane Okafor")
    refused = policy.screen("Jane Okafor of Leeds loses her job.", conn, OUTSIDE)
    assert refused is not None and refused.code == "private_person"
    assert refused.detail == policy.DETAIL["private_person"]


def test_classifier_refuses_persuasion(conn, monkeypatch):
    stub(monkeypatch, rule="election_persuasion", quote="moves Latino voters")
    assert code("See which framing moves Latino voters.", conn) == "election_persuasion"


def test_classifier_quote_not_in_the_event_does_not_refuse(conn, monkeypatch):
    stub(monkeypatch, rule="private_person", quote="John Smith")
    assert code("A chip shortage doubles phone prices.", conn) is None


def test_classifier_election_name_refuses_only_inside_the_window(conn, monkeypatch):
    stub(monkeypatch, election_name="Senator Ruiz")
    text = "Senator Ruiz resigns after a scandal."
    assert code(text, conn, INSIDE) == "election_window"
    assert code(text, conn, OUTSIDE) is None


def test_classifier_that_cannot_run_raises(conn, monkeypatch):
    monkeypatch.setattr(settings, "SCREEN_MAX_COST_USD", 0.0)
    with pytest.raises(llm.BudgetExceeded):
        policy.screen("A chip shortage doubles phone prices.", conn, OUTSIDE)
    assert rows(conn) == 0

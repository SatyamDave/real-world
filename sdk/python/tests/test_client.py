import json
from pathlib import Path

import httpx
import pytest

from realworld import API_VERSION, Client

OPENAPI = Path(__file__).parents[3] / "api" / "openapi.json"
EVENT = {"event": {"text": "A chip shortage doubles phone prices worldwide."}}
CREATED = {"id": "job_1", "status": "queued", "links": {"self": "/s", "events": "/e"}}


def recording(responses):
    """A client over a fake transport that records each request and answers from responses."""
    seen = []

    def handle(request):
        seen.append(request)
        return responses[len(seen) - 1](request)

    return Client(transport=httpx.MockTransport(handle)), seen


def test_simulate_generates_an_idempotency_key_and_sends_the_version():
    client, seen = recording([lambda r: httpx.Response(202, json=CREATED)] * 2)
    assert client.simulate(EVENT).id == "job_1"
    client.simulate(EVENT)
    first, second = seen
    assert first.headers["Real-World-Version"] == API_VERSION
    assert first.headers["Idempotency-Key"]
    assert first.headers["Idempotency-Key"] != second.headers["Idempotency-Key"]
    assert json.loads(first.content) == EVENT


def test_an_api_key_is_sent_as_a_bearer_token_and_no_key_sends_none():
    seen = []

    def handle(request):
        seen.append(request)
        return httpx.Response(202, json=CREATED)

    Client(transport=httpx.MockTransport(handle), api_key="rw_abc").simulate(EVENT)
    Client(transport=httpx.MockTransport(handle)).simulate(EVENT)
    assert seen[0].headers["Authorization"] == "Bearer rw_abc"
    assert "Authorization" not in seen[1].headers


def test_simulate_sends_the_given_idempotency_key():
    client, seen = recording([lambda r: httpx.Response(202, json=CREATED)])
    client.simulate(EVENT, idempotency_key="k-1")
    assert seen[0].headers["Idempotency-Key"] == "k-1"


def test_pinned_version_matches_the_openapi_file():
    assert API_VERSION == json.loads(OPENAPI.read_text())["info"]["version"]


def test_an_error_status_raises_with_the_body():
    client, _ = recording([lambda r: httpx.Response(402, json={"detail": "over cap"})])
    with pytest.raises(httpx.HTTPStatusError, match="402.*over cap"):
        client.simulate(EVENT)


def stream(*chunks, drop=False):
    def body():
        yield from (c.encode() for c in chunks)
        if drop:
            raise httpx.ReadError("connection dropped")

    return lambda r: httpx.Response(200, content=body())


def test_events_parse_sse_skip_heartbeats_and_resume_from_the_last_id():
    client, seen = recording(
        [
            stream('id: 1\ndata: {"type": "progress", "day": 1}\n\n: heartbeat\n\n', drop=True),
            stream(
                'id: 2\ndata: {"type": "progress", "day": 2}\n\n',
                'id: 3\ndata: {"type": "succeeded"}\n\n',
            ),
        ]
    )
    events = list(client.events("job_1"))
    assert [e.get("day") for e in events] == [1, 2, None]
    assert events[-1]["type"] == "succeeded"
    assert "Last-Event-ID" not in seen[0].headers
    assert seen[1].headers["Last-Event-ID"] == "1"


def test_events_give_up_after_a_second_drop_in_a_row():
    client, _ = recording([stream(drop=True), stream(drop=True)])
    with pytest.raises(httpx.ReadError):
        list(client.events("job_1"))

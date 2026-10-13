import json
from pathlib import Path

import httpx
import pytest

from realworld import API_VERSION, ApiError, Client

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


def test_an_error_status_raises_api_error_with_the_parsed_body():
    refusal = {"code": "key_cap_spent", "detail": "over cap"}
    client, _ = recording([lambda r: httpx.Response(402, json=refusal)])
    with pytest.raises(ApiError, match='^402: {"code":"key_cap_spent","detail":"over cap"}$') as e:
        client.simulate(EVENT)
    assert (e.value.status, e.value.body) == (402, refusal)
    assert (e.value.code, e.value.detail) == ("key_cap_spent", "over cap")


def test_a_body_that_is_not_json_is_kept_as_text():
    client, _ = recording([lambda r: httpx.Response(502, text="bad gateway")])
    with pytest.raises(ApiError, match="^502: bad gateway$") as e:
        client.world()
    assert (e.value.body, e.value.code, e.value.detail) == ("bad gateway", None, None)


def test_a_connection_error_is_retried_once_and_no_more():
    def drop(request):
        raise httpx.ConnectError("refused")

    client, seen = recording([drop, lambda r: httpx.Response(200, json={})])
    client.scores()
    assert len(seen) == 2
    client, seen = recording([drop, drop, drop])
    with pytest.raises(httpx.ConnectError):
        client.scores()
    assert len(seen) == 2


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


def test_events_send_the_key_and_version_and_raise_api_error_with_the_parsed_body():
    refusal = {"detail": "no simulation job_1"}
    seen = []

    def handle(request):
        seen.append(request)
        return httpx.Response(404, json=refusal)

    client = Client(transport=httpx.MockTransport(handle), api_key="rw_abc")
    with pytest.raises(ApiError) as e:
        list(client.events("job_1"))
    assert e.value.status == 404
    assert e.value.body == refusal
    assert seen[0].headers["Authorization"] == "Bearer rw_abc"
    assert seen[0].headers["Real-World-Version"] == API_VERSION

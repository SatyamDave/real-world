"""Client for the Real World Simulate API. Contract: product/sdks.md and api/openapi.json."""

import json
import time
import uuid
from collections.abc import Iterator
from typing import Any

import httpx
from pydantic import TypeAdapter

from realworld.generated.models import (
    Agent,
    AgentWhy,
    BaselineSkill,
    Daily,
    Estimate,
    Job,
    JobCreated,
    ReceiptDay,
    Receipts,
    SimulateRequest,
    SimulateResult,
    World,
)

API_VERSION = "2026-10-27"
TERMINAL = ("succeeded", "failed")
_SCORES = TypeAdapter(dict[str, BaselineSkill])


def _body(request: SimulateRequest | dict[str, Any]) -> dict[str, Any]:
    req = SimulateRequest.model_validate(request)
    return req.model_dump(mode="json", exclude_unset=True)


def _sse(lines: Iterator[str]) -> Iterator[tuple[str | None, dict[str, Any]]]:
    """(id, data) for each event; comment lines such as heartbeats are skipped."""
    event_id, data = None, []
    for line in lines:
        if line == "":
            if data:
                yield event_id, json.loads("\n".join(data))
            event_id, data = None, []
        elif line.startswith("id:"):
            event_id = line[3:].strip()
        elif line.startswith("data:"):
            data.append(line[5:].strip())


class Client:
    def __init__(
        self, base_url: str = "http://localhost:8000", transport: httpx.BaseTransport | None = None
    ) -> None:
        self._http = httpx.Client(
            base_url=base_url,
            transport=transport or httpx.HTTPTransport(retries=1),
            headers={"Real-World-Version": API_VERSION},
            timeout=30,
        )

    def _send(self, method: str, path: str, **kwargs: Any) -> Any:
        r = self._http.request(method, path, **kwargs)
        if r.is_error:
            raise httpx.HTTPStatusError(f"{r.status_code}: {r.text}", request=r.request, response=r)
        return r.json()

    def simulate(
        self, request: SimulateRequest | dict[str, Any], idempotency_key: str | None = None
    ) -> JobCreated:
        key = idempotency_key or str(uuid.uuid4())
        body = self._send(
            "POST", "/v1/simulate", json=_body(request), headers={"Idempotency-Key": key}
        )
        return JobCreated.model_validate(body)

    def estimate(self, request: SimulateRequest | dict[str, Any]) -> Estimate:
        return Estimate.model_validate(
            self._send("POST", "/v1/simulate/estimate", json=_body(request))
        )

    def get_simulation(self, id: str) -> Job:
        return Job.model_validate(self._send("GET", f"/v1/simulations/{id}"))

    def wait(self, id: str, timeout: float = 120, interval: float = 0.5) -> SimulateResult:
        """Poll until the job finishes; raise if it failed or timeout seconds pass."""
        deadline = time.monotonic() + timeout
        while True:
            job = self.get_simulation(id)
            if job.status == "failed":
                raise RuntimeError(f"simulation {id} failed: {job.error}")
            if job.result is not None:
                return job.result
            if time.monotonic() > deadline:
                raise TimeoutError(f"simulation {id} still {job.status} after {timeout}s")
            time.sleep(interval)

    def events(self, id: str, last_event_id: str | None = None) -> Iterator[dict[str, Any]]:
        """Progress events until the job finishes, reconnecting once with Last-Event-ID if the
        connection drops."""
        retried = False
        while True:
            headers = {"Last-Event-ID": last_event_id} if last_event_id else {}
            try:
                with self._http.stream("GET", f"/v1/simulations/{id}/events", headers=headers) as r:
                    if r.is_error:
                        r.read()
                        raise httpx.HTTPStatusError(
                            f"{r.status_code}: {r.text}", request=r.request, response=r
                        )
                    for event_id, data in _sse(r.iter_lines()):
                        last_event_id, retried = event_id or last_event_id, False
                        yield data
                        if data.get("type") in TERMINAL:
                            return
                return
            except httpx.TransportError:
                if retried:
                    raise
                retried = True

    def world(self) -> World:
        return World.model_validate(self._send("GET", "/v1/world"))

    def agent(self, id: str) -> Agent:
        return Agent.model_validate(self._send("GET", f"/v1/agents/{id}"))

    def agent_why(self, id: str) -> AgentWhy:
        return AgentWhy.model_validate(self._send("GET", f"/v1/agents/{id}/why"))

    def daily(self, player_id: str | None = None) -> Daily:
        params = {"player_id": player_id} if player_id else {}
        return Daily.model_validate(self._send("GET", "/v1/daily", params=params))

    def answer_daily(self, question_id: str, player_id: str, probability: float) -> Daily:
        body = {"question_id": question_id, "player_id": player_id, "probability": probability}
        return Daily.model_validate(self._send("POST", "/v1/daily/answers", json=body))

    def receipts(self) -> Receipts:
        return Receipts.model_validate(self._send("GET", "/v1/receipts"))

    def receipt_day(self, date: str) -> ReceiptDay:
        return ReceiptDay.model_validate(self._send("GET", f"/v1/receipts/{date}"))

    def scores(self) -> dict[str, BaselineSkill]:
        return _SCORES.validate_python(self._send("GET", "/v1/scores"))

"""Client for the Real World API. Contract: product/sdks.md and api/openapi.json."""

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
    LeafReceipt,
    Population,
    QuestionPage,
    ReceiptDay,
    Receipts,
    Scoreboard,
    SimulateRequest,
    SimulateResult,
    SystemStatus,
    World,
)

API_VERSION = "2026-10-27"
TERMINAL = ("succeeded", "failed")
_SCORES = TypeAdapter(dict[str, BaselineSkill])


class ApiError(Exception):
    """An error status from the API, with the parsed response body."""

    def __init__(self, status: int, body: Any) -> None:
        text = body if isinstance(body, str) else json.dumps(body, separators=(",", ":"))
        super().__init__(f"{status}: {text}")
        self.status = status
        self.body = body

    @property
    def detail(self) -> Any:
        return self.body.get("detail") if isinstance(self.body, dict) else None

    @property
    def code(self) -> Any:
        return self.body.get("code") if isinstance(self.body, dict) else None


def _error(r: httpx.Response) -> ApiError:
    try:
        return ApiError(r.status_code, r.json())
    except ValueError:
        return ApiError(r.status_code, r.text)


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
        self,
        base_url: str = "http://localhost:8000",
        *,
        api_key: str | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        """Without an API key the API treats the caller as anonymous."""
        headers = {"Real-World-Version": API_VERSION}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self._http = httpx.Client(
            base_url=base_url, transport=transport, headers=headers, timeout=30
        )

    def _send(self, method: str, path: str, **kwargs: Any) -> Any:
        try:
            r = self._http.request(method, path, **kwargs)
        except httpx.TransportError:
            r = self._http.request(method, path, **kwargs)
        if r.is_error:
            raise _error(r)
        return r.json()

    def simulate(
        self, request: SimulateRequest | dict[str, Any], idempotency_key: str | None = None
    ) -> JobCreated:
        """Starts a fork of today's world with one event and returns its job."""
        key = idempotency_key or str(uuid.uuid4())
        body = self._send(
            "POST", "/v1/simulate", json=_body(request), headers={"Idempotency-Key": key}
        )
        return JobCreated.model_validate(body)

    def estimate(self, request: SimulateRequest | dict[str, Any]) -> Estimate:
        """Estimates the cost of a fork without running it."""
        return Estimate.model_validate(
            self._send("POST", "/v1/simulate/estimate", json=_body(request))
        )

    def get_simulation(self, id: str) -> Job:
        """Returns a fork's job, with its result once it has succeeded."""
        return Job.model_validate(self._send("GET", f"/v1/simulations/{id}"))

    def wait(self, id: str, timeout: float = 120, interval: float = 0.5) -> SimulateResult:
        """Polls until the fork finishes and returns its result, or fails if the fork failed or
        timeout seconds pass."""
        deadline = time.monotonic() + timeout
        while True:
            job = self.get_simulation(id)
            if job.status == "failed":
                raise RuntimeError(f"fork {id} failed: {job.error}")
            if job.result is not None:
                return job.result
            if time.monotonic() > deadline:
                raise TimeoutError(f"fork {id} still {job.status} after {timeout}s")
            time.sleep(interval)

    def events(self, id: str, last_event_id: str | None = None) -> Iterator[dict[str, Any]]:
        """Yields the fork's progress events until it finishes, reconnecting once with Last-Event-ID
        if the connection drops."""
        retried = False
        while True:
            headers = {"Last-Event-ID": last_event_id} if last_event_id else {}
            try:
                with self._http.stream("GET", f"/v1/simulations/{id}/events", headers=headers) as r:
                    if r.is_error:
                        r.read()
                        raise _error(r)
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
        """Returns today's world: countries, coverage tiers, topic shares and prefilled
        fork events."""
        return World.model_validate(self._send("GET", "/v1/world"))

    def population(self) -> Population:
        """Returns the simulated population: every country, segment and topic with its
        calibration and spread."""
        return Population.model_validate(self._send("GET", "/v1/world/population"))

    def agent(self, id: str) -> Agent:
        """Returns one simulated agent: its traits, beliefs and what moved them."""
        return Agent.model_validate(self._send("GET", f"/v1/agents/{id}"))

    def agent_why(self, id: str) -> AgentWhy:
        """Returns a short model-written account of what moved one agent, labelled simulated."""
        return AgentWhy.model_validate(self._send("GET", f"/v1/agents/{id}/why"))

    def daily(self, player_id: str | None = None) -> Daily:
        """Returns today's question, with the reveal once this player has answered."""
        params = {"player_id": player_id} if player_id else {}
        return Daily.model_validate(self._send("GET", "/v1/daily", params=params))

    def answer_daily(self, question_id: str, player_id: str, probability: float) -> Daily:
        """Answers today's question once and returns the reveal."""
        body = {"question_id": question_id, "player_id": player_id, "probability": probability}
        return Daily.model_validate(self._send("POST", "/v1/daily/answers", json=body))

    def receipts(self) -> Receipts:
        """Lists every day record with its root and record hash."""
        return Receipts.model_validate(self._send("GET", "/v1/receipts"))

    def receipt_day(self, date: str) -> ReceiptDay:
        """Returns one day record with each receipt's entry, salt and leaf hash."""
        return ReceiptDay.model_validate(self._send("GET", f"/v1/receipts/{date}"))

    def status(self) -> SystemStatus:
        """Returns the live system status: latest cycle, ledger head, anchor, model, spend."""
        return SystemStatus.model_validate(self._send("GET", "/v1/status"))

    def receipt_leaf(self, date: str, leaf_hash: str) -> LeafReceipt:
        """Returns one receipt with its inclusion proof up to the day record's root."""
        path = f"/v1/receipts/{date}/leaves/{leaf_hash}"
        return LeafReceipt.model_validate(self._send("GET", path))

    def question(self, id: str) -> QuestionPage:
        """Returns one question with every committed forecast by day and forecaster."""
        return QuestionPage.model_validate(self._send("GET", f"/v1/questions/{id}"))

    def scores(self) -> dict[str, BaselineSkill]:
        """Returns the skill of the simulation against each baseline."""
        return _SCORES.validate_python(self._send("GET", "/v1/scores"))

    def scoreboard(self) -> Scoreboard:
        """Returns the scoreboard: Brier per forecaster, skill, reliability bins and misses."""
        return Scoreboard.model_validate(self._send("GET", "/v1/scoreboard"))

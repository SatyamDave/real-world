import json
from pathlib import Path

from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from rw_api.app import app

OPENAPI = Path(__file__).resolve().parents[1] / "openapi.json"


def test_committed_openapi_matches_the_app():
    assert json.loads(OPENAPI.read_text()) == app.openapi(), (
        "run make openapi and commit the result"
    )


def test_root_redirects_to_the_docs_and_every_operation_has_a_written_summary():
    r = TestClient(app).get("/", follow_redirects=False)
    assert r.is_redirect and r.headers["location"] == "/docs"
    routes = [r for r in app.routes if isinstance(r, APIRoute) and r.include_in_schema]
    assert routes and all(r.summary for r in routes), [r.path for r in routes if not r.summary]

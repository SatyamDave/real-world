import json
from pathlib import Path

from rw_api.app import app

OPENAPI = Path(__file__).resolve().parents[1] / "openapi.json"


def test_committed_openapi_matches_the_app():
    assert json.loads(OPENAPI.read_text()) == app.openapi(), (
        "run make openapi and commit the result"
    )

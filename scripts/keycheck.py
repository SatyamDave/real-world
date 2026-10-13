"""Check an OpenRouter key before a real run, using only free endpoints (key, credits, models)."""

import json
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "engine"))
from rw import settings  # noqa: E402

BASE = settings.OPENROUTER_BASE_URL


def fetch(path: str, key: str) -> dict:
    req = urllib.request.Request(BASE + path, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def run(env: dict, get=fetch) -> int:
    key = env.get("OPENROUTER_API_KEY")
    if not key:
        print("OPENROUTER_API_KEY is not set: export it, then run make keycheck again")
        return 1
    info = get("/key", key)["data"]
    credits = get("/credits", key)["data"]
    models = {m["id"] for m in get("/models", key)["data"]}
    left = credits["total_credits"] - credits["total_usage"]
    limit = info.get("limit")
    print(f"key label: {info.get('label')}")
    print(
        "key limit remaining: " + ("no limit" if limit is None else f"${limit - info['usage']:.2f}")
    )
    print(f"account credit remaining: ${left:.2f}")
    for name, model in (
        ("Jev", settings.JEV_OPENROUTER_MODEL),
        ("text", env.get("RW_TEXT_MODEL", settings.TEXT_MODEL)),
    ):
        status = "reachable" if model in models else "NOT listed by OpenRouter"
        print(f"{name} model {model}: {status}")
    if left <= 0:
        print(
            "OpenRouter account is out of credit: add credit at https://openrouter.ai/settings/credits"
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(run(dict(os.environ)))

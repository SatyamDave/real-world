"""keycheck reports balances and model reachability from stubbed responses, and fails closed."""

import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("keycheck", Path(__file__).with_name("keycheck.py"))
keycheck = importlib.util.module_from_spec(spec)
spec.loader.exec_module(keycheck)


def stub(credits):
    data = {
        "/key": {"label": "sk-or-v1-abc...xyz", "usage": 2.0, "limit": 10},
        "/credits": credits,
        "/models": [{"id": keycheck.settings.JEV_OPENROUTER_MODEL}, {"id": "other/model"}],
    }
    return lambda path, key: {"data": data[path]}


def test_reports_and_passes_with_credit(capsys):
    assert (
        keycheck.run({"OPENROUTER_API_KEY": "k"}, stub({"total_credits": 30, "total_usage": 5}))
        == 0
    )
    out = capsys.readouterr().out
    assert "key limit remaining: $8.00" in out
    assert "account credit remaining: $25.00" in out
    assert "reachable" in out and "NOT listed" in out  # Jev listed, text model not


def test_fails_when_out_of_credit(capsys):
    assert (
        keycheck.run({"OPENROUTER_API_KEY": "k"}, stub({"total_credits": 30, "total_usage": 30.49}))
        == 1
    )
    assert "https://openrouter.ai/settings/credits" in capsys.readouterr().out


def test_fails_without_key(capsys):
    assert keycheck.run({}) == 1
    assert "OPENROUTER_API_KEY is not set" in capsys.readouterr().out

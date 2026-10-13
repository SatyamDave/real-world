import json
import os
import subprocess
from pathlib import Path

import pytest

from rw import ledger

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "mirror_receipts.sh"


@pytest.fixture(autouse=True)
def no_user_git_config(monkeypatch):
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", "/dev/null")
    monkeypatch.setenv("GIT_CONFIG_NOSYSTEM", "1")


@pytest.fixture
def home(tmp_path, monkeypatch):
    monkeypatch.setenv("RW_HOME", str(tmp_path / "var"))
    (tmp_path / "var" / "receipts").mkdir(parents=True)
    return tmp_path / "var"


@pytest.fixture
def remote(tmp_path):
    path = tmp_path / "remote.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(path)], check=True)
    return str(path)


def mirror(remote: str | None) -> subprocess.CompletedProcess[str]:
    env = {k: v for k, v in os.environ.items() if k != "RECEIPTS_MIRROR_REMOTE"}
    if remote is not None:
        env["RECEIPTS_MIRROR_REMOTE"] = remote
    return subprocess.run([str(SCRIPT)], cwd=ROOT, env=env, capture_output=True, text=True)


def git(remote: str, *args: str) -> str:
    return subprocess.run(
        ["git", "--git-dir", remote, *args], check=True, capture_output=True, text=True
    ).stdout


def receipt(home: Path, date: str, question_id: str = "us-cpi-oct") -> None:
    entry, salt = {"question_id": question_id}, "00" * 16
    leaf = ledger.leaf_hash(entry, salt)
    day = {
        "date": date,
        "prev_root": ledger.GENESIS_ROOT,
        "root": ledger.merkle_root([leaf]),
        "leaf_count": "1",
        "protocol_hash": "a" * 64,
        "engine_version": "test",
    }
    body = {
        "day": day,
        "record_hash": ledger.record_hash(day),
        "entries": [{"entry": entry, "salt": salt, "leaf_hash": leaf}],
    }
    (home / "receipts" / f"{date}.json").write_text(json.dumps(body) + "\n")


def test_off_when_the_remote_is_unset(home):
    out = mirror(None)
    assert out.returncode == 0
    assert out.stdout == "receipts mirror off: RECEIPTS_MIRROR_REMOTE is not set\n"
    assert not (home / "mirror").exists()


def test_pushes_new_days_once_and_never_rewrites_a_mirrored_day(home, remote):
    receipt(home, "2026-10-05", "fx-usa-cpi-rise")
    receipt(home, "2026-10-14")
    receipt(home, "2026-10-15")
    out = mirror(remote)
    assert out.returncode == 0, out.stderr
    assert out.stdout == "receipts mirror: pushed receipts through 2026-10-15\n"
    files = git(remote, "ls-tree", "-r", "--name-only", "main").split()
    assert files == ["receipts/2026-10-14.json", "receipts/2026-10-15.json"]
    shown = git(remote, "show", "main:receipts/2026-10-15.json")
    assert shown == (home / "receipts" / "2026-10-15.json").read_text()
    assert remote not in (home / "mirror" / ".git" / "config").read_text()

    head = git(remote, "rev-parse", "main").strip()
    out = mirror(remote)
    assert out.returncode == 0 and out.stdout == "receipts mirror: nothing new\n"
    assert git(remote, "rev-parse", "main").strip() == head

    receipt(home, "2026-10-16")
    assert mirror(remote).returncode == 0
    assert git(remote, "log", "--format=%s", "main").splitlines() == [
        "chore: receipts through 2026-10-16",
        "chore: receipts through 2026-10-15",
    ]
    assert git(remote, "diff", "--name-only", head, "main").split() == ["receipts/2026-10-16.json"]

    receipt(home, "2026-10-14", "us-cpi-nov")
    head = git(remote, "rev-parse", "main").strip()
    out = mirror(remote)
    assert out.returncode == 1 and "2026-10-14.json differs" in out.stderr
    assert git(remote, "rev-parse", "main").strip() == head


def test_a_tampered_day_refuses_the_whole_push_and_names_the_file(home, remote):
    receipt(home, "2026-10-14")
    receipt(home, "2026-10-15")
    path = home / "receipts" / "2026-10-15.json"
    body = json.loads(path.read_text())
    body["entries"][0]["entry"]["question_id"] = "us-cpi-forged"
    path.write_text(json.dumps(body) + "\n")
    out = mirror(remote)
    assert out.returncode == 1
    assert "2026-10-15.json" in out.stderr and "2026-10-14.json" not in out.stderr
    assert git(remote, "branch", "--list").strip() == ""

    path.unlink()
    assert mirror(remote).returncode == 0
    assert git(remote, "ls-tree", "-r", "--name-only", "main").split() == [
        "receipts/2026-10-14.json"
    ]

"""Each repo check reports a planted violation and passes on a clean tree."""

import shutil
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parent


def run(root: Path, script: str) -> tuple[int, str]:
    (root / "scripts").mkdir(exist_ok=True)
    shutil.copy(SCRIPTS / script, root / "scripts" / script)
    r = subprocess.run(
        [sys.executable, str(root / "scripts" / script)], capture_output=True, text=True
    )
    return r.returncode, r.stdout


def write(root: Path, files: dict[str, str]) -> None:
    for rel, text in files.items():
        (root / rel).parent.mkdir(parents=True, exist_ok=True)
        (root / rel).write_text(text)


DESIGN_CLEAN = {
    "web/src/styles.css": ".a { border-radius: var(--radius); font-weight: 600;"
    " box-shadow: var(--card-shadow); }\n.b { border-radius: 50%; box-shadow: none; }\n",
    "web/src/A.tsx": 'export function Card() {\n  return <div className="a" />;\n}\n',
    "web/src/B.tsx": "export function Globe() {\n"
    "  return <canvas style={{ /* design: per-frame position */ left: x }} />;\n}\n",
}


def test_design_passes_a_clean_tree(tmp_path):
    write(tmp_path, DESIGN_CLEAN)
    assert run(tmp_path, "check_design.py")[0] == 0


@pytest.mark.parametrize(
    "rel, text, expected",
    [
        ("web/src/C.tsx", "const c = <div style={{ left: 1 }} />;\n", "C.tsx:1: inline style"),
        ("landing/src/D.tsx", 'const d = <div style="left: 1" />;\n', "D.tsx:1: inline style"),
        ("web/src/x.css", ".x { border-radius: 4px; }\n", "x.css:1: border-radius 4px"),
        ("web/src/x.css", ".x {\n  font-weight: 700;\n}\n", "x.css:2: font-weight 700"),
        ("web/src/x.css", ".x { box-shadow: 0 1px 2px red; }\n", "x.css:1: box-shadow 0 1px"),
        (
            "web/src/sub/Card.tsx",
            "export const Card = () => null;\n",
            "web/src/sub/Card.tsx:1: duplicate component Card, also at web/src/A.tsx:1",
        ),
    ],
)
def test_design_reports_each_rule(tmp_path, rel, text, expected):
    write(tmp_path, {**DESIGN_CLEAN, rel: text})
    code, out = run(tmp_path, "check_design.py")
    assert code == 1 and expected in out, out

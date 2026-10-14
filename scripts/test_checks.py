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


GLOSSARY_CLEAN = {
    "product/glossary.md": "| Term | Meaning | Do not write |\n| --- | --- | --- |\n"
    "| Agent | One simulated person. | persona, respondent |\n"
    "| Fork | A simulation. | scenario, what-if |\n| Topic | One belief. | |\n",
    "web/src/App.tsx": 'const label = "Fork this agent";\n',
    "web/src/App.test.tsx": 'it("ignores a persona in a test", () => {});\n',
    "web/src/fixtures/world.ts": 'export const note = "persona";\n',
    "sdk/typescript/src/generated/schema.ts": "// respondent\n",
}


def test_glossary_passes_a_clean_tree(tmp_path):
    write(tmp_path, GLOSSARY_CLEAN)
    code, out = run(tmp_path, "check_glossary.py")
    assert code == 0, out


@pytest.mark.parametrize(
    "rel, text, expected",
    [
        ("web/src/App.tsx", "<p>Personas</p>\n", 'App.tsx:1: "Personas" is not a glossary term'),
        ("README.md", "\nTry a What-If.\n", 'README.md:2: "What-If" is not a glossary term; write'),
        ("api/rw_api/app.py", "# scenarios\n", '"scenarios" is not a glossary term; write "Fork"'),
        ("product/web-app.md", "100 respondents\n", 'write "Agent"'),
    ],
)
def test_glossary_reports_a_banned_word(tmp_path, rel, text, expected):
    write(tmp_path, {**GLOSSARY_CLEAN, rel: text})
    code, out = run(tmp_path, "check_glossary.py")
    assert code == 1 and expected in out, out


def test_glossary_ignores_a_word_inside_another(tmp_path):
    write(tmp_path, {**GLOSSARY_CLEAN, "product/fork.md": "personality, scenariography\n"})
    assert run(tmp_path, "check_glossary.py")[0] == 0


PY_CLIENT = """class Client:
    def __init__(self, base_url: str = "x") -> None:
        pass

    def _send(self, path: str) -> None:
        pass

    def wait(self, id: str, timeout: float = 120, interval: float = 0.5) -> None:
        pass

    def daily(self, player_id: str | None = None) -> None:
        pass
"""
TS_CLIENT = """export class Client {
  private http;

  constructor(
    private baseUrl = "x",
    private fetcher: typeof fetch = (...args) => fetch(...args),
  ) {}

  private send(path: string) {}

  async wait(id: string, timeout = 120, interval = 0.5): Promise<void> {
    if (id) return;
  }

  daily(player_id?: string): Promise<Record<string, number>> {
    return ok(this.http.GET("/v1/daily", { params: { query: { player_id } } }));
  }
}
"""


def sdk_tree(root: Path, py: str = PY_CLIENT, ts: str = TS_CLIENT) -> None:
    write(root, {"sdk/python/realworld/client.py": py, "sdk/typescript/src/index.ts": ts})


def test_sdk_parity_passes_matching_clients(tmp_path):
    sdk_tree(tmp_path)
    code, out = run(tmp_path, "check_sdk_parity.py")
    assert code == 0 and "2 methods match" in out, out


@pytest.mark.parametrize(
    "py, ts, expected",
    [
        (
            PY_CLIENT + "\n    def world(self) -> None:\n        pass\n",
            TS_CLIENT,
            "client.py:14: method world is in Python only; add it to TypeScript",
        ),
        (
            PY_CLIENT,
            TS_CLIENT.replace("  daily(", "  world(): void {}\n\n  daily("),
            "index.ts:15: method world is in TypeScript only; add it to Python",
        ),
        (
            PY_CLIENT,
            TS_CLIENT.replace("interval = 0.5)", "interval = 0.5, signal?: AbortSignal)"),
            "wait() parameter signal is in TypeScript only",
        ),
        (
            PY_CLIENT.replace("player_id: str | None = None", "player_id: str"),
            TS_CLIENT,
            "daily(player_id) defaults to (required) in Python and None in TypeScript",
        ),
        (
            PY_CLIENT,
            TS_CLIENT.replace("timeout = 120", "timeout = 60"),
            "wait(timeout) defaults to 120 in Python and 60 in TypeScript",
        ),
        (
            PY_CLIENT,
            TS_CLIENT.replace("daily(player_id?", "daily(playerId?"),
            "daily() parameter player_id is playerId in TypeScript; use one spelling",
        ),
        (
            PY_CLIENT,
            TS_CLIENT.replace("async wait(", "async waitFor(").replace("  daily(", "  dailyQ("),
            "method daily is in Python only",
        ),
    ],
)
def test_sdk_parity_reports_each_difference(tmp_path, py, ts, expected):
    sdk_tree(tmp_path, py, ts)
    code, out = run(tmp_path, "check_sdk_parity.py")
    assert code == 1 and expected in out, out


def test_sdk_parity_reports_a_camel_case_method(tmp_path):
    py = PY_CLIENT.replace("def daily(", "def answer_daily(")
    sdk_tree(tmp_path, py, TS_CLIENT.replace("  daily(", "  answerDaily("))
    code, out = run(tmp_path, "check_sdk_parity.py")
    assert code == 1 and "method answer_daily is answerDaily in TypeScript" in out, out


LICENCE_CLEAN = {
    "package.json": '{"name": "a", "private": true, "license": "Apache-2.0"}\n',
    "engine/pyproject.toml": '[project]\nname = "a"\nlicense = { text = "Apache-2.0" }\n',
    "pyproject.toml": '[tool.uv.workspace]\nmembers = ["engine"]\n',
}


def licence_run(root: Path, files: dict[str, str]):
    write(root, files)
    subprocess.run(["git", "init", "-q"], cwd=root, check=True)
    return run(root, "check_licence.py")


def test_licence_passes_a_clean_tree(tmp_path):
    code, out = licence_run(tmp_path, LICENCE_CLEAN)
    assert code == 0, out


@pytest.mark.parametrize(
    "rel, text, expected",
    [
        ("web/package.json", '{"name": "w", "private": true}\n', "web/package.json: needs"),
        ("sdk/package.json", '{"name": "s", "license": "MIT"}\n', "sdk/package.json: needs"),
        ("api/pyproject.toml", '[project]\nname = "x"\n', "api/pyproject.toml: needs"),
    ],
)
def test_licence_reports_a_missing_field(tmp_path, rel, text, expected):
    code, out = licence_run(tmp_path, {**LICENCE_CLEAN, rel: text})
    assert code == 1 and expected in out, out

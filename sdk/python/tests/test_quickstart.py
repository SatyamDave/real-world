"""Runs the README quickstart verbatim against a live API; `make e2e` starts one."""

import os
import re
from pathlib import Path

import pytest

from realworld.generated.models import SimulateResult

URL = os.environ.get("RW_API_URL")
README = Path(__file__).parents[1] / "README.md"


@pytest.mark.skipif(not URL, reason="needs a live API: run make e2e")
def test_readme_quickstart_prints_a_typed_result(capsys):
    match = re.search(r"```python\n(.*?)```", README.read_text(), re.S)
    assert match, "the README has no python block"
    code = match.group(1).replace("http://localhost:8000", str(URL))
    scope: dict = {}
    exec(code, scope)
    assert isinstance(scope["result"], SimulateResult)
    lines = capsys.readouterr().out.splitlines()
    assert lines[0].startswith("AI-simulated.")
    assert len(lines) == 1 + len(scope["result"].top_shifts) + len(scope["result"].outputs)
    assert any(" p10 " in line for line in lines)

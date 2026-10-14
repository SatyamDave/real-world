"""Fail if any package.json or pyproject.toml project lacks the Apache-2.0 licence fields.

Usage: python3 scripts/check_licence.py
A pyproject.toml with no [project] table (the uv workspace root) is not a package and is skipped.
"""

import json
import pathlib
import subprocess
import sys
import tomllib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def tracked(pattern):
    return subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", pattern],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()


def main():
    bad = []
    for name in tracked("*package.json"):
        d = json.loads((ROOT / name).read_text())
        if d.get("license") != "Apache-2.0":
            bad.append(f'{name}: needs "license": "Apache-2.0"')
    for name in tracked("*pyproject.toml"):
        project = tomllib.loads((ROOT / name).read_text()).get("project")
        if project is not None and project.get("license") != {"text": "Apache-2.0"}:
            bad.append(f'{name}: needs license = {{ text = "Apache-2.0" }}')
    print("\n".join(bad))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()

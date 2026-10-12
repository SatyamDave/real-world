"""Fail if any relative link in a tracked markdown file does not resolve.

Usage: python3 scripts/check_links.py
"""

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
FENCE = re.compile(r"^```.*?^```", re.S | re.M)


def main():
    files = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "*.md"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.split()
    broken = []
    for name in files:
        path = ROOT / name
        if path.name == "_TEMPLATE.md":  # placeholders like [Title](url)
            continue
        for target in LINK.findall(FENCE.sub("", path.read_text())):
            if re.match(r"^[a-z]+:", target) or target.startswith("#"):
                continue
            resolved = (path.parent / target.split("#")[0]).resolve()
            if resolved.exists():
                continue
            broken.append(f"{name}: {target}")
    print("\n".join(broken) or f"All links resolve in {len(files)} files.")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())

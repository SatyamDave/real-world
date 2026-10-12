"""Fail if any relative link in a tracked markdown file does not resolve.

Usage: python3 scripts/check_links.py [--research-fallback DIR]

--research-fallback DIR treats a link to research/<area>/<file>.md as valid when
DIR/<area>/<file>.md exists, for branches written before the notes merged.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LINK = re.compile(r"\[[^\]]*\]\(([^)\s]+)\)")
FENCE = re.compile(r"^```.*?^```", re.S | re.M)


def main(argv):
    fallback = pathlib.Path(argv[argv.index("--research-fallback") + 1]) if "--research-fallback" in argv else None
    files = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "*.md"],
        cwd=ROOT, capture_output=True, text=True, check=True,
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
            rel = resolved.relative_to(ROOT).parts if resolved.is_relative_to(ROOT) else ()
            if fallback and len(rel) == 3 and rel[0] == "research" and (fallback / rel[1] / rel[2]).exists():
                continue
            broken.append(f"{name}: {target}")
    print("\n".join(broken) or f"All links resolve in {len(files)} files.")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

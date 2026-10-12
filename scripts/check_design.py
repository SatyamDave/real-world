"""Fail if a UI folder bypasses the shared design tokens.

Usage: python3 scripts/check_design.py

Every colour and typeface in web/ and landing/ comes from styles/tokens*.css and
styles/fonts.css. A raw hex colour or a literal font-family anywhere else is how two
surfaces drift into two looks. While web/ and landing/ each hold a tokens.css, their
:root blocks must be identical.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
UI = ["web/src", "landing/src"]
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
FONT = re.compile(r"font-family:(?!\s*var\(--font-)")
EXEMPT = re.compile(r"(^|/)styles/(tokens[^/]*|fonts)\.css$|\.test\.tsx?$|/fixtures/")


def root_block(path):
    text = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.S)
    match = re.search(r":root\s*\{(.*?)\}", text, re.S)
    return (
        sorted(line.strip() for line in match.group(1).splitlines() if line.strip())
        if match
        else []
    )


def main():
    problems = []
    for folder in UI:
        base = ROOT / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            rel = path.relative_to(ROOT).as_posix()
            if path.suffix not in {".css", ".ts", ".tsx"} or EXEMPT.search(rel):
                continue
            for n, line in enumerate(path.read_text().splitlines(), 1):
                # Pure black and transparent in a gradient are alpha masks, not colours.
                masked = re.sub(r"#0{3,4}\b", "", line) if "gradient(" in line else line
                for pattern, what in ((HEX, "raw hex colour"), (FONT, "literal font-family")):
                    if pattern.search(masked):
                        problems.append(f"{rel}:{n}: {what}; use a token from styles/tokens.css")
    web, landing = ROOT / "web/src/styles/tokens.css", ROOT / "landing/src/styles/tokens.css"
    if web.exists() and landing.exists() and root_block(web) != root_block(landing):
        problems.append("web and landing tokens.css differ; change both together or share one file")
    print("\n".join(problems) or "Design tokens: no literal colours or fonts outside tokens.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

"""Fail if a user-facing surface uses a word the glossary bans.

Usage: python3 scripts/check_glossary.py

product/glossary.md defines each term once; its "Do not write" column lists the synonyms
that would give one thing two names. This scans the app, API, SDKs, README and specs
for those words, singular or plural, in any case.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GLOSSARY = ROOT / "product/glossary.md"
SURFACES = [
    "web/src/**/*.ts",
    "web/src/**/*.tsx",
    "landing/src/**/*.ts",
    "landing/src/**/*.tsx",
    "api/rw_api/*.py",
    "api/README.md",
    "api/openapi.json",
    "sdk/python/realworld/*.py",
    "sdk/python/README.md",
    "sdk/typescript/src/*.ts",
    "sdk/typescript/README.md",
    "README.md",
    "engine/rw/daily.py",
    "engine/rw/experiments.py",
    "product/*.md",
]
SKIP = re.compile(r"\.test\.tsx?$|/fixtures/|/generated/|^product/glossary\.md$")


def banned() -> dict[str, str]:
    """Each banned word, lowercased, mapped to the term to write instead."""
    words = {}
    for line in GLOSSARY.read_text().splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != 3 or cells[0] in {"Term", "---"}:
            continue
        for word in cells[2].replace("`", "").split(","):
            if word.strip():
                words[word.strip().lower()] = cells[0]
    return words


def main():
    words = banned()
    if not words:
        print("Glossary: no Do not write words found in product/glossary.md")
        return 1
    pattern = re.compile(
        r"\b(" + "|".join(re.escape(w) for w in sorted(words, key=len, reverse=True)) + r")s?\b",
        re.I,
    )
    paths = {p for glob in SURFACES for p in ROOT.glob(glob) if p.is_file()}
    paths = sorted(p for p in paths if not SKIP.search(p.relative_to(ROOT).as_posix()))
    problems = []
    for path in paths:
        rel = path.relative_to(ROOT).as_posix()
        for n, line in enumerate(path.read_text().splitlines(), 1):
            for m in pattern.finditer(line):
                term = words[m.group(1).lower()]
                problems.append(f'{rel}:{n}: "{m.group(0)}" is not a glossary term; write "{term}"')
    print("\n".join(problems) or f"Glossary: no banned synonym in {len(paths)} files.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

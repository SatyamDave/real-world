"""The papers' table in papers/INDEX.md as rows, one per paper folder."""

import re
from pathlib import Path
from typing import Any

from rw.experiments import REPO

PAPERS = REPO / "papers"
COLUMNS = ("short_title", "title", "claim", "stage", "venue", "pending")


def _plain(cell: str) -> str:
    return cell.replace("`", "").replace("*", "").strip()


def papers(root: Path = PAPERS) -> list[dict[str, Any]]:
    """Papers in the order of the INDEX.md table, with the folder each one builds from."""
    rows = []
    for line in (root / "INDEX.md").read_text().splitlines():
        m = re.match(r"\| \*[^|]*\* \(`([\w-]+)/`\) \|", line)
        if m:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            short = re.sub(r" \(`[\w-]+/`\)$", "", cells[0])
            row = dict(zip(COLUMNS, map(_plain, [short, *cells[1:]]), strict=True))
            rows.append({"slug": m.group(1), **row})
    return rows

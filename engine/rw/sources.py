import csv
from pathlib import Path

SOURCES_CSV = Path(__file__).resolve().parents[2] / "data" / "sources.csv"


class SourceNotCleared(Exception):
    pass


def require(source_id: str) -> dict[str, str]:
    """Return the licence row for source_id, or raise unless we may use it commercially."""
    with SOURCES_CSV.open(newline="") as f:
        row = next((r for r in csv.DictReader(f) if r["source_id"] == source_id), None)
    if row is None:
        raise SourceNotCleared(f"{source_id}: not listed in data/sources.csv")
    if row["kind"] != "fixture" and row["commercial_use"] != "yes":
        raise SourceNotCleared(f"{source_id}: commercial_use is {row['commercial_use']!r}")
    return row

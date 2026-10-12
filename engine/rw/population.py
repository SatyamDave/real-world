"""Sample a population of agents from the bundled country marginals and store it as daily snapshots.

Agents are a dict of equal-length numpy arrays, one per column of the agent state in decision 0001.
"""

import argparse
import csv
import hashlib
from collections import Counter
from collections.abc import Mapping
from datetime import date as Date
from pathlib import Path

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

from rw import settings, sources

DATA = sources.SOURCES_CSV.parent
SAMPLE = DATA / "sample"
SOURCE_ID = "fixture_sample"

RUBRIC = ("population", "attitudes", "markets", "news", "ground_truth")
TIER_FLOORS = (("A", 75), ("B", 50), ("C", 25))

# These belong in settings.py, which this slice may not touch.
COUNTRY_FLOOR_SHARE = 0.01
STUBBORNNESS_BETA = (2.0, 5.0)
OFFSET_SD_LOGIT = 0.5
JITTER_DEGREES = 2.0

Agents = dict[str, np.ndarray]


def _read(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def topics() -> list[str]:
    return [r["topic"] for r in _read(DATA / "topics.csv")]


def countries() -> list[dict[str, str]]:
    return _read(DATA / "countries.csv")


def coverage_tier(row: Mapping[str, str | int]) -> str:
    score = sum(int(row[part]) for part in RUBRIC)
    return next((tier for tier, floor in TIER_FLOORS if score >= floor), "D")


def segment_key(agent: Mapping[str, object]) -> str:
    return f"{agent['country']}|{agent['age_band']}|{agent['education']}"


def country_weights(rows: list[dict[str, str]]) -> np.ndarray:
    """Population-proportional shares where no country falls below COUNTRY_FLOOR_SHARE."""
    pop = np.array([float(r["population_millions"]) for r in rows])
    floored = np.zeros(len(rows), dtype=bool)
    while True:
        free = 1.0 - COUNTRY_FLOOR_SHARE * floored.sum()
        w = np.where(floored, COUNTRY_FLOOR_SHARE, free * pop / pop[~floored].sum())
        newly = ~floored & (w < COUNTRY_FLOOR_SHARE)
        if not newly.any():
            return w
        floored |= newly


def allocate(n: int, weights: np.ndarray) -> np.ndarray:
    """Integer counts summing to n, by largest remainder."""
    exact = n * weights
    counts = np.floor(exact).astype(int)
    order = np.argsort(-(exact - counts), kind="stable")
    counts[order[: n - counts.sum()]] += 1
    return counts


def sample_population(n: int, seed: int) -> Agents:
    sources.require(SOURCE_ID)
    rng = np.random.default_rng(seed)
    rows = countries()
    tps = topics()
    counts = allocate(n, country_weights(rows))

    cells: dict[str, list[dict[str, str]]] = {}
    for r in _read(SAMPLE / "demographics.csv"):
        cells.setdefault(r["iso3"], []).append(r)
    attitudes = {(r["iso3"], r["topic"]): r for r in _read(SAMPLE / "attitudes.csv")}

    cols: dict[str, list[np.ndarray]] = {}
    for row, k in zip(rows, counts, strict=True):
        iso = row["iso3"]
        cs = cells[iso]
        p = np.array([float(c["share"]) for c in cs])
        pick = rng.choice(len(cs), size=k, p=p / p.sum())
        part: Agents = {
            "country": np.full(k, iso),
            "age_band": np.array([cs[i]["age_band"] for i in pick], dtype=str),
            "sex": np.array([cs[i]["sex"] for i in pick], dtype=str),
            "education": np.array([cs[i]["education"] for i in pick], dtype=str),
            "urban": np.array([int(cs[i]["urban"]) for i in pick], dtype=np.int8),
            "tier": np.full(k, coverage_tier(row)),
            "lat": float(row["lat"]) + rng.uniform(-JITTER_DEGREES, JITTER_DEGREES, k),
            "lng": float(row["lng"]) + rng.uniform(-JITTER_DEGREES, JITTER_DEGREES, k),
            "s": rng.beta(*STUBBORNNESS_BETA, k),
            "offset": rng.normal(0.0, OFFSET_SD_LOGIT, k),
        }
        effects = segment_effects(part, tps)
        for j, t in enumerate(tps):
            a = attitudes[(iso, t)]
            mean = float(a["mean_share"])
            noise = rng.normal(0.0, float(a["survey_sd_logit"]), k)
            part[f"b0_{t}"] = np.log(mean / (1 - mean)) + effects[:, j] + noise
        for name, values in part.items():
            cols.setdefault(name, []).append(values)

    agents = {name: np.concatenate(parts) for name, parts in cols.items()}
    width = len(str(max(n - 1, 0)))
    agents["agent_id"] = np.array([f"a{i:0{width}d}" for i in range(n)])
    agents["segment"] = np.array(
        [
            segment_key({"country": c, "age_band": a, "education": e})
            for c, a, e in zip(
                agents["country"], agents["age_band"], agents["education"], strict=True
            )
        ]
    )
    for t in tps:
        agents[f"b_{t}"] = agents[f"b0_{t}"].copy()
    order = ["agent_id", "country", "age_band", "sex", "education", "urban", "segment", "tier"]
    order += ["lat", "lng", "s", "offset"] + [f"b_{t}" for t in tps] + [f"b0_{t}" for t in tps]
    return {name: agents[name] for name in order}


def segment_effects(traits: Mapping[str, np.ndarray], tps: list[str]) -> np.ndarray:
    """(n_agents, n_topics) sum of the delta_logit rows whose trait value each agent has."""
    n = len(next(iter(traits.values())))
    out = np.zeros((n, len(tps)))
    for r in _read(SAMPLE / "segment_effects.csv"):
        has = np.asarray(traits[r["trait"]]).astype(str) == r["value"]
        out[has, tps.index(r["topic"])] += float(r["delta_logit"])
    return out


def snapshot_path(date: str | Date) -> Path:
    return settings.rw_home() / "snapshots" / str(date) / "agents.parquet"


def write_snapshot(date: str | Date, agents: Agents) -> str:
    path = snapshot_path(date)
    path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(pa.table(agents), path, compression="zstd")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_snapshot(date: str | Date) -> Agents:
    table = pq.read_table(snapshot_path(date))
    out: Agents = {}
    for name in table.column_names:
        values = table[name].to_numpy()
        is_text = pa.types.is_string(table.schema.field(name).type)
        out[name] = values.astype(str) if is_text else values
    return out


def latest_snapshot_date() -> str | None:
    found = (settings.rw_home() / "snapshots").glob("*/agents.parquet")
    days = sorted(p.parent.name for p in found)
    return days[-1] if days else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Sample a world and write its snapshot.")
    parser.add_argument("--n", type=int, default=settings.WORLD_AGENTS)
    parser.add_argument("--seed", type=int, default=settings.WORLD_SEED)
    parser.add_argument("--date", default=Date.today().isoformat())
    args = parser.parse_args()

    agents = sample_population(args.n, args.seed)
    counts = Counter(agents["country"].tolist())
    for row in countries():
        print(f"{row['iso3']}  tier {coverage_tier(row)}  {counts[row['iso3']]:>6} agents")
    print(f"total {len(agents['agent_id'])} agents in {len(counts)} countries")
    sha = write_snapshot(args.date, agents)
    print(f"wrote {snapshot_path(args.date)} sha256 {sha}")


if __name__ == "__main__":
    main()

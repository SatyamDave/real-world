"""Compute every corpus count the paper quotes and write them as LaTeX macros.

Run:  python3 data/counts.py          (rewrites data/counts.tex)
      python3 data/counts.py --check  (exits 1 if data/counts.tex is stale)

paper.tex inputs data/counts.tex and quotes counts only through these macros,
so the text cannot drift from corpus.csv, reconciliation.csv or its own tables.
"""

import collections
import csv
import itertools
import pathlib
import re
import sys

d = pathlib.Path(__file__).parent
rows = list(csv.DictReader(open(d / "corpus.csv")))
pairs = list(csv.DictReader(open(d / "reconciliation.csv")))
tex = (d.parent / "paper.tex").read_text()
by = {r["key"]: r for r in rows}
emp = [r for r in rows if r["role"] == "included"]


def read_ok(r):
    return r["read"] in ("fulltext", "partial")


def codes(s):
    return frozenset(x for x in s.split(";") if x)


role = collections.Counter(r["role"] for r in rows)
base = [r for r in emp if "base" in codes(r["A4"])]
spread = [r for r in emp if r["spread_vs_human"]]
unseen = [r for r in emp if r["unseen_human_data"] in ("yes", "likely")]


# Share of study pairs that differ on at least one determinable axis (A1-A4).
def differs(a, b):
    for ax in ("A1", "A2", "A3", "A4"):
        x, y = codes(a[ax].replace("?", "")), codes(b[ax].replace("?", ""))
        if x and y and x != y:
            return True
    return False


all_pairs = list(itertools.combinations(emp, 2))
base_rate = round(100 * sum(differs(a, b) for a, b in all_pairs) / len(all_pairs))

conf = [p for p in pairs if p["conflict"] == "yes"]
placebo = sum(by[p["study_a"]]["first_public"] != by[p["study_b"]]["first_public"] for p in conf)

# Rows of Tables 1 and 2 and their read markers, parsed from paper.tex.
body = tex[tex.index(r"\label{tab:dist}") : tex.index(r"\label{tab:map}")]
trows = [line for line in body.splitlines() if line.startswith(r"\citet{")]
multi = [r for r in emp if len(codes(r["A3"])) > 1 and codes(r["A4"]) - {"none"}]

c = {
    "Bib": len(rows),
    "Included": role["included"] + role["position"],
    "Emp": len(emp),
    "Pos": role["position"],
    "Rel": role["related"],
    "Ctx": role["context"],
    "EmpPeer": sum(r["peer_reviewed"] == "yes" for r in emp),
    "EmpExt": sum(r["peer_reviewed"] == "ext-abstract" for r in emp),
    "EmpSingle": sum(r["single_author"] == "yes" for r in emp),
    "EmpUS": sum(r["country"] == "US" for r in emp),
    "EmpFull": sum(r["read"] == "fulltext" for r in emp),
    "EmpPartial": sum(r["read"] == "partial" for r in emp),
    "EmpAbstract": sum(r["read"] == "abstract" for r in emp),
    "EmpYearTwentySix": sum(r["first_public"] == "2026" for r in emp),
    "None": sum(codes(r["A4"]) == {"none"} for r in emp),
    "ReadOK": sum(read_ok(r) for r in emp),
    "NoneReadOK": sum(codes(r["A4"]) == {"none"} and read_ok(r) for r in emp),
    "Base": len(base),
    "BaseReadOK": sum(read_ok(r) for r in base),
    "BaseAhead": sum(r["base_outcome"] == "baseline_ahead" for r in base),
    "BaseLevel": sum(r["base_outcome"] == "level" for r in base),
    "BaseMixed": sum(r["base_outcome"] == "mixed" for r in base),
    "BaseLLM": sum(r["base_outcome"] == "llm_ahead" for r in base),
    "BasePeer": sum(r["peer_reviewed"] == "yes" for r in base),
    "Spread": len(spread),
    "SpreadLower": sum(r["spread_vs_human"] == "lower" for r in spread),
    "SpreadReadOK": sum(read_ok(r) for r in spread),
    "Unseen": len(unseen),
    "Pairs": len(pairs),
    "Conflicts": len(conf),
    "Within": sum(p["within_study"] == "yes" for p in pairs),
    "NotConflict": sum(p["status"] == "not_conflict" for p in pairs),
    "Reconciled": sum(p["status"] == "reconciled" for p in conf),
    "PartialPair": sum(p["status"] == "partial" for p in conf),
    "Unexplained": sum(p["status"] == "unexplained" for p in conf),
    "DirPred": sum(p["direction_predicted"].startswith("yes") for p in conf),
    "PlaceboYear": placebo,
    "BaseRatePct": base_rate,
    "MultiUnitRef": len(multi),
    "Rows": len(trows),
    "RowsAbstract": sum(r"\ab" in line for line in trows),
}
c["RowsFull"] = c["Rows"] - c["RowsAbstract"]
# Lee, Peng and Toubia share a panel or infrastructure; count them as one source.
group = {"lee2026openweight", "peng2025funhouse", "toubia2025twin"}
gs = [r for r in spread if r["key"] in group]
c["SpreadDedup"] = len(spread) - len(gs) + (1 if gs else 0)
gs_lower = [r for r in gs if r["spread_vs_human"] == "lower"]
c["SpreadDedupLower"] = c["SpreadLower"] - len(gs_lower) + (1 if gs_lower else 0)
props = {
    "POne": ["wang2026ess", "williams2026beyond", "ashokkumar2026", "kim2026korean"],
    "PThree": [r["key"] for r in base],
    "PFour": ["atari2023", "tao2024", "liu2025global", "bulte2026"],
    "PFive": ["bisbee2024", "lee2026openweight", "liu2025global"],
    "OOne": [r["key"] for r in unseen],
}
for p, keys in props.items():
    c[p + "N"] = len(keys)
    c[p + "Peer"] = sum(by[k]["peer_reviewed"] == "yes" for k in keys)

refs = ["none", "unif", "floor", "ceil", "base", "hum"]
names = {
    "U1": "U1 marginal",
    "U2": "U2 contrast / rank",
    "U3": "U3 joint structure",
    "U4": "U4 individual",
    "U5": "U5 effect",
}
lines = []
for u, label in names.items():
    cnt = collections.Counter(a for r in emp if u in codes(r["A3"]) for a in codes(r["A4"]))
    lines.append(label + " & " + " & ".join(str(cnt[x]) for x in refs) + r" \\")

out = [
    "% Generated by data/counts.py from corpus.csv, reconciliation.csv and paper.tex. Do not edit."
]
out += [rf"\newcommand{{\c{k}}}{{{v}}}" for k, v in sorted(c.items())]
out.append(r"\newcommand{\EvidenceMapRows}{" + "\n".join(lines) + "}")
text = "\n".join(out) + "\n"
assert all(re.fullmatch(r"[A-Za-z]+", k) for k in c), "macro names must be letters only"

pr = {"yes": "yes", "report": "rep", "workshop": "ws", "ext-abstract": "ext"}
rd = {"fulltext": "full", "partial": "part", "abstract": "abs"}


def country(r):
    return r["country"].replace(";", ", ") if r["country"] != "-" else "---"


matrix = [
    rf"\citet{{{r['key']}}} & {country(r)} & "
    + " & ".join(r[a].replace(";", ",") for a in ("A1", "A2", "A3", "A4"))
    + f" & {rd[r['read']]} & {pr.get(r['peer_reviewed'], '---')} "
    + r"\\"
    for r in emp
]
mtext = "% Generated by data/counts.py from corpus.csv. Do not edit.\n"
mtext += "\n".join(matrix) + "\n\\bottomrule\n"

for k, v in sorted(c.items()):
    print(f"{k}: {v}")
print("\n".join(lines))
outputs = {d / "counts.tex": text, d / "matrix.tex": mtext}
for target, content in outputs.items():
    if "--check" in sys.argv:
        if not target.exists() or target.read_text() != content:
            sys.exit(f"{target.name} is stale; run python3 data/counts.py")
    else:
        target.write_text(content)

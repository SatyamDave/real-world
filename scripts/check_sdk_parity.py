"""Fail if the Python and TypeScript SDK clients drift apart.

Usage: python3 scripts/check_sdk_parity.py

product/sdks.md promises one client in two languages. This compares the public methods of
Client in sdk/python/realworld/client.py and sdk/typescript/src/index.ts: the same names,
the same parameter names, and the same defaults, with Python None matching an optional
TypeScript parameter.
"""

import ast
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PY = "sdk/python/realworld/client.py"
TS = "sdk/typescript/src/index.ts"
TS_METHOD = re.compile(r"^  (?:async\s+)?(?:\*\s*)?([A-Za-z_]\w*)\s*(?:<[^(]*>)?\(", re.M)
REQUIRED = "(required)"

# name -> (line, {parameter: default source text, None for null, or REQUIRED})
Methods = dict[str, tuple[int, dict[str, str | None]]]


def snake(name: str) -> str:
    return re.sub(r"(?<=[a-z0-9])([A-Z])", r"_\1", name).lower()


def norm(value: str | None) -> str | None:
    """A default as comparable text: None for null, numbers as floats, strings unquoted."""
    if value is None or value.strip() in {"None", "undefined"}:
        return None
    value = value.strip()
    try:
        return repr(float(value))
    except ValueError:
        pass
    if len(value) > 1 and value[0] == value[-1] and value[0] in "'\"`":
        return value[1:-1]
    return {"True": "true", "False": "false"}.get(value, value)


def python_methods(text: str) -> Methods:
    tree = ast.parse(text)
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "Client")
    methods = {}
    for fn in cls.body:
        if not isinstance(fn, ast.FunctionDef) or fn.name.startswith("_"):
            continue
        args = fn.args.posonlyargs + fn.args.args
        defaults = [None] * (len(args) - len(fn.args.defaults)) + list(fn.args.defaults)
        pairs = [*zip(args, defaults, strict=True)]
        pairs += zip(fn.args.kwonlyargs, fn.args.kw_defaults, strict=True)
        params = {a.arg: ast.unparse(d) if d else REQUIRED for a, d in pairs if a.arg != "self"}
        methods[fn.name] = (fn.lineno, params)
    return methods


def split_top(text: str, sep: str) -> list[str]:
    """text split on sep wherever no bracket is open; the arrow => is not a bracket."""
    parts, depth, start = [], 0, 0
    for i, ch in enumerate(text):
        if ch in "([{<":
            depth += 1
        elif ch in ")]}>" and text[i - 1 : i + 1] != "=>":
            depth -= 1
        elif ch == sep and depth == 0 and text[i + 1 : i + 2] not in {">", "="}:
            parts.append(text[start:i])
            start = i + 1
    return [*parts, text[start:]]


def ts_methods(text: str) -> Methods:
    start = text.index("export class Client")
    body = text[start : text.index("\n}", start)]
    methods = {}
    for m in TS_METHOD.finditer(body):
        if m.group(1) in {"constructor", "private", "protected", "static", "readonly"}:
            continue
        depth, end = 1, m.end()
        while depth:
            depth += {"(": 1, ")": -1}.get(body[end], 0)
            end += 1
        params = {}
        for raw in split_top(body[m.end() : end - 1], ","):
            if not raw.strip():
                continue
            head, *default = split_top(raw, "=")
            name = re.match(r"(?:(?:public|readonly)\s+)*(\w+)(\??)", head.strip())
            assert name, f"cannot read parameter {raw!r} of {m.group(1)}"
            optional = name.group(2) == "?"
            params[name.group(1)] = (
                default[0].strip() if default else None if optional else REQUIRED
            )
        methods[m.group(1)] = (text.count("\n", 0, start + m.start()) + 1, params)
    return methods


def pair_up(py: dict, ts: dict, what: str, py_at, ts_at) -> tuple[list[str], list]:
    """Problems for a name on one side only or spelled two ways, and the matched pairs."""
    problems, pairs = [], []
    ts_by_key = {snake(n): n for n in ts}
    for p in py:
        t = ts_by_key.pop(snake(p), None)
        if t is None:
            problems.append(f"{py_at(p)}: {what}{p} is in Python only; add it to TypeScript")
            continue
        if t != p:
            problems.append(f"{py_at(p)}: {what}{p} is {t} in TypeScript; use one spelling")
        pairs.append((p, t))
    for t in ts_by_key.values():
        problems.append(f"{ts_at(t)}: {what}{t} is in TypeScript only; add it to Python")
    return problems, pairs


def main():
    py = python_methods((ROOT / PY).read_text())
    ts = ts_methods((ROOT / TS).read_text())
    problems, shared = pair_up(
        py, ts, "method ", lambda n: f"{PY}:{py[n][0]}", lambda n: f"{TS}:{ts[n][0]}"
    )
    for p, t in shared:
        py_at, ts_at = f"{PY}:{py[p][0]}", f"{TS}:{ts[t][0]}"
        found, params = pair_up(
            py[p][1], ts[t][1], f"{p}() parameter ", lambda _, a=py_at: a, lambda _, a=ts_at: a
        )
        problems += found
        for a, b in params:
            dp, dt = py[p][1][a], ts[t][1][b]
            if norm(dp) != norm(dt):
                problems.append(
                    f"{py_at}: {p}({a}) defaults to {dp} in Python and {dt} in TypeScript;"
                    " make them equal"
                )
    ok = f"SDK parity: {len(shared)} methods match in Python and TypeScript."
    print("\n".join(problems) or ok)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

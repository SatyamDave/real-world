"""Fail if a UI folder bypasses the shared design tokens.

Usage: python3 scripts/check_design.py

Every colour and typeface in web/ and landing/ comes from styles/tokens*.css and
styles/fonts.css. A raw hex colour or a literal font-family anywhere else is how two
surfaces drift into two looks. While web/ and landing/ each hold a tokens.css, their
:root blocks must be identical. Inline styles, off-token radii and shadows, unloaded font
weights and a second component with the same name are the same drift by other routes.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
UI = ["web/src", "landing/src"]
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
FONT = re.compile(r"font-family:(?!\s*var\(--font-)")
EXEMPT = re.compile(r"(^|/)styles/(tokens[^/]*|fonts)\.css$|\.test\.tsx?$|/fixtures/")
INLINE = re.compile(r"""style=(\{\{|")""")
# An inline style that says why on its line or the next (biome moves the comment down) may stay.
OPT_OUT = re.compile(r"/\*\s*design:\s*\S")
# fonts.css loads only 400, 500 and 600; any other weight renders faux-bold or faux-light.
ALLOWED = {
    "border-radius": ({"var(--radius)", "0", "50%", "inherit"}, "use var(--radius), 0 or 50%"),
    "font-weight": ({"400", "500", "600"}, "use 400, 500 or 600, the weights fonts.css loads"),
    "box-shadow": ({"var(--card-shadow)", "none"}, "use var(--card-shadow), none or an inset ring"),
}
VALUE = re.compile(r"(border-radius|font-weight|box-shadow):\s*([^;}]+)")
COMPONENT = re.compile(r"^export (?:default )?(?:function|const|class) ([A-Z]\w*[a-z]\w*)")


def root_block(path):
    text = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.S)
    match = re.search(r":root\s*\{(.*?)\}", text, re.S)
    return (
        sorted(line.strip() for line in match.group(1).splitlines() if line.strip())
        if match
        else []
    )


def main():
    problems, components = [], {}
    for folder in UI:
        base = ROOT / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*")):
            rel = path.relative_to(ROOT).as_posix()
            if path.suffix not in {".css", ".ts", ".tsx"} or EXEMPT.search(rel):
                continue
            lines = path.read_text().splitlines()
            for n, line in enumerate(lines, 1):
                # Pure black and transparent in a gradient are alpha masks, not colours.
                masked = re.sub(r"#0{3,4}\b", "", line) if "gradient(" in line else line
                for pattern, what in ((HEX, "raw hex colour"), (FONT, "literal font-family")):
                    if pattern.search(masked):
                        problems.append(f"{rel}:{n}: {what}; use a token from styles/tokens.css")
                if (
                    path.suffix == ".tsx"
                    and INLINE.search(line)
                    and not OPT_OUT.search("\n".join(lines[n - 1 : n + 1]))
                ):
                    problems.append(
                        f"{rel}:{n}: inline style; put it in styles.css under a class"
                        " (or say why on the line with /* design: ... */)"
                    )
                for prop, value in VALUE.findall(line):
                    allowed, fix = ALLOWED[prop]
                    # An inset ring is a border drawn without layout, not a shadow.
                    if value.strip() not in allowed and not value.strip().startswith("inset "):
                        problems.append(f"{rel}:{n}: {prop} {value.strip()}; {fix}")
                name = folder == "web/src" and path.suffix == ".tsx" and COMPONENT.match(line)
                if name:
                    components.setdefault(name.group(1), []).append(f"{rel}:{n}")
    for name, places in components.items():
        for place in places[1:]:
            problems.append(
                f"{place}: duplicate component {name}, also at {places[0]}; keep one and import it"
            )
    web, landing = ROOT / "web/src/styles/tokens.css", ROOT / "landing/src/styles/tokens.css"
    if web.exists() and landing.exists() and root_block(web) != root_block(landing):
        problems.append("web and landing tokens.css differ; change both together or share one file")
    ok = "Design: tokens only, no inline styles, no duplicate components."
    print("\n".join(problems) or ok)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

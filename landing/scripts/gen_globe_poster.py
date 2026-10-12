#!/usr/bin/env python3
"""Generate the static dot-globe poster from Natural Earth 1:110m countries.

The poster is the landing globe's LCP image and the fallback for no-WebGL and
prefers-reduced-motion visitors (the live globe is cobe). Land dots are sampled
from web/public/countries-110m.geojson (Natural Earth, public domain) and drawn
in an orthographic projection centred on the Atlantic so the first receipt
events (US Fed, euro-area ECB, Brazil) sit on the visible hemisphere.

Run: python3 landing/scripts/gen_globe_poster.py
Output: landing/public/globe-poster.svg
"""

import json
import math
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
GEOJSON = ROOT / "web" / "public" / "countries-110m.geojson"
OUT = ROOT / "landing" / "public" / "globe-poster.svg"

# Projection centre and sampling grid.
LON0, LAT0 = -35.0, 25.0
STEP = 2.0
R = 240.0  # globe radius in SVG units
DOT = 1.15  # dot radius
PAD = 10.0


def rings_of(geom):
    t = geom["type"]
    if t == "Polygon":
        return [geom["coordinates"][0]]
    if t == "MultiPolygon":
        return [poly[0] for poly in geom["coordinates"]]
    return []


def bbox(ring):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)


def point_in_ring(lon, lat, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat):
            x_cross = (xj - xi) * (lat - yi) / (yj - yi) + xi
            if lon < x_cross:
                inside = not inside
        j = i
    return inside


def main():
    data = json.loads(GEOJSON.read_text())
    land = []
    for feat in data["features"]:
        for ring in rings_of(feat["geometry"]):
            land.append((bbox(ring), ring))

    lon0 = math.radians(LON0)
    lat0 = math.radians(LAT0)
    sin_lat0, cos_lat0 = math.sin(lat0), math.cos(lat0)

    dots = []
    lat = -82.0
    while lat <= 82.0:
        lon = -180.0
        while lon < 180.0:
            for (x0, y0, x1, y1), ring in land:
                if x0 <= lon <= x1 and y0 <= lat <= y1 and point_in_ring(lon, lat, ring):
                    la, lo = math.radians(lat), math.radians(lon)
                    cos_c = sin_lat0 * math.sin(la) + cos_lat0 * math.cos(la) * math.cos(lo - lon0)
                    if cos_c > 0:  # visible hemisphere only
                        px = math.cos(la) * math.sin(lo - lon0)
                        py = cos_lat0 * math.sin(la) - sin_lat0 * math.cos(la) * math.cos(lo - lon0)
                        dots.append((R + px * R, R - py * R))
                    break
            lon += STEP
        lat += STEP

    size = 2 * R + 2 * PAD
    circles = "".join(
        f'<circle cx="{x + PAD:.1f}" cy="{y + PAD:.1f}" r="{DOT}"/>' for x, y in dots
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size:.0f} {size:.0f}" '
        f'role="img" aria-label="A dot-sampled globe of the world\'s land, centred on the Atlantic">'
        f'<defs><radialGradient id="sea" cx="38%" cy="34%" r="75%">'
        f'<stop offset="0%" stop-color="#E9ECEA"/><stop offset="100%" stop-color="#DCE1DE"/>'
        f"</radialGradient></defs>"
        f'<circle cx="{R + PAD:.0f}" cy="{R + PAD:.0f}" r="{R:.0f}" fill="url(#sea)"/>'
        f'<g fill="#2F6F4E" fill-opacity="0.9">{circles}</g>'
        f"</svg>"
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg)
    print(f"wrote {OUT.relative_to(ROOT)} with {len(dots)} land dots ({len(svg)} bytes)")


if __name__ == "__main__":
    main()

import type { Country } from "@real-world/sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactGlobe, { type GlobeMethods } from "react-globe.gl";
import { pct, prefersReducedMotion, topicLabel } from "./App";

interface Feature {
  properties: { iso3: string; name: string };
}

type Palette = Record<"paper2" | "accent" | "clay" | "line" | "ink", string>;

// The globe draws in WebGL, so it reads the colour tokens instead of inheriting them.
function palette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    paper2: v("--paper-2"),
    accent: v("--accent"),
    clay: v("--accent-2"),
    line: v("--line"),
    ink: v("--ink"),
  };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** A share from 0 to 1 on a ramp towards verify green; 0 is still a visible green on paper. */
function shade(share: number, p: Palette) {
  const [lo, hi] = [rgb(p.paper2), rgb(p.accent)];
  const t = 0.5 + 0.5 * share;
  return `rgb(${lo.map((c, i) => Math.round(c + (hi[i] - c) * t)).join(",")})`;
}

const alpha = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;

// One pulse when the globe appears: each simulated country rings once, then the rings clear.
const PULSE_MS = 2400;

// A one-colour texture, since the default globe is black and a custom material needs three.js.
const ocean = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="2" height="1"><rect width="2" height="1" fill="${color}"/></svg>`)}`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export default function Globe({
  countries,
  onSelect,
  paused,
}: {
  countries: Country[];
  onSelect: (c: Country) => void;
  paused: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [shapes, setShapes] = useState<Feature[]>([]);
  const [hover, setHover] = useState<Feature | null>(null);
  const [colors, setColors] = useState(palette);
  const [ready, setReady] = useState(false);
  const [rings, setRings] = useState<Country[]>([]);
  const [still] = useState(prefersReducedMotion);
  const topics = Object.keys(countries[0]?.shares ?? {});
  const [topic, setTopic] = useState(topics[0] ?? "");
  const byIso = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);

  useEffect(() => {
    // A static asset, not API data, so it does not go through api.ts.
    fetch("/countries-110m.geojson")
      .then((r) => r.json())
      .then((g: { features: Feature[] }) => setShapes(g.features));
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => setColors(palette());
    mq.addEventListener("change", onTheme);
    const ro = new ResizeObserver(([e]) =>
      setSize({ width: e.contentRect.width, height: e.contentRect.height }),
    );
    if (box.current) ro.observe(box.current);
    return () => {
      mq.removeEventListener("change", onTheme);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const controls = globe.current?.controls();
    if (controls) controls.autoRotate = !paused && !still;
  }, [paused, still]);

  useEffect(() => {
    if (!rings.length) return;
    const t = setTimeout(() => setRings([]), PULSE_MS);
    return () => clearTimeout(t);
  }, [rings]);

  function onReady() {
    const g = globe.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = !paused && !still;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    g.pointOfView({ lat: 18, lng: 12, altitude: size.width < 600 ? 3 : 2.4 });
    setReady(true);
    if (!still) setRings(countries);
  }

  const empty = colors.line;

  return (
    <div className={`globe-live${ready ? " ready" : ""}`} ref={box}>
      {size.width > 0 && (
        <ReactGlobe
          ref={globe}
          onGlobeReady={onReady}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={ocean(colors.paper2)}
          showAtmosphere
          atmosphereColor={colors.accent}
          atmosphereAltitude={0.12}
          ringsData={rings}
          ringLat={(c) => (c as Country).lat}
          ringLng={(c) => (c as Country).lng}
          ringColor={() => (t: number) => alpha(colors.clay, 1 - t)}
          ringMaxRadius={5}
          ringPropagationSpeed={3}
          ringRepeatPeriod={PULSE_MS * 2}
          hexPolygonsData={shapes}
          hexPolygonResolution={3}
          hexPolygonMargin={0.4}
          hexPolygonUseDots
          hexPolygonAltitude={(f) => (f === hover ? 0.02 : 0.004)}
          hexPolygonColor={(f) => {
            const c = byIso.get((f as Feature).properties.iso3);
            if (!c) return empty;
            return c.experimental ? colors.clay : shade(c.shares[topic] ?? 0, colors);
          }}
          hexPolygonLabel={(f) => {
            const p = (f as Feature).properties;
            const c = byIso.get(p.iso3);
            if (!c)
              return `<div class="globe-tip"><b>${escapeHtml(p.name)}</b><br/>Not simulated</div>`;
            return `<div class="globe-tip"><b>${escapeHtml(c.name)}</b> · tier ${c.tier}${
              c.experimental ? " · experimental" : ""
            }<br/>${escapeHtml(topicLabel(topic))}: ${pct(c.shares[topic] ?? 0)} lean yes<br/><span>Click to read one agent</span></div>`;
          }}
          onHexPolygonHover={(f) => setHover(f as Feature | null)}
          onHexPolygonClick={(f) => {
            const c = byIso.get((f as Feature).properties.iso3);
            if (c) onSelect(c);
          }}
          hexPolygonsTransitionDuration={300}
        />
      )}
      <div className="globe-controls">
        <label>
          <span className="sr-only">Topic shown on the globe</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {topics.map((t) => (
              <option key={t} value={t}>
                {topicLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <div className="legend">
          <span>0%</span>
          <span
            className="legend-ramp"
            style={{
              /* design: computed position */
              background: `linear-gradient(90deg, ${shade(0, colors)}, ${shade(1, colors)})`,
            }}
          />
          <span>100% lean yes</span>
        </div>
        <p className="legend-note">
          <span className="swatch swatch-empty" /> not simulated
          <span className="swatch swatch-exp" /> experimental today
        </p>
      </div>
    </div>
  );
}

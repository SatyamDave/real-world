import type { Country } from "@real-world/sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactGlobe, { type GlobeMethods } from "react-globe.gl";
import { pct, topicLabel } from "./App";

interface Feature {
  properties: { iso3: string; name: string };
}

const dark = () => matchMedia("(prefers-color-scheme: dark)").matches;

const LOW = { light: [199, 210, 254], dark: [58, 50, 150] };
const HIGH = { light: [49, 40, 160], dark: [199, 210, 254] };

function shade(share: number, theme: "light" | "dark") {
  const [lo, hi] = [LOW[theme], HIGH[theme]];
  return `rgb(${lo.map((c, i) => Math.round(c + (hi[i] - c) * share)).join(",")})`;
}

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
  const [theme, setTheme] = useState<"light" | "dark">(dark() ? "dark" : "light");
  const topics = Object.keys(countries[0]?.shares ?? {});
  const [topic, setTopic] = useState(topics[0] ?? "");
  const byIso = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);

  useEffect(() => {
    // A static asset, not API data, so it does not go through api.ts.
    fetch("/countries-110m.geojson")
      .then((r) => r.json())
      .then((g: { features: Feature[] }) => setShapes(g.features));
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => setTheme(mq.matches ? "dark" : "light");
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
    if (controls) controls.autoRotate = !paused;
  }, [paused]);

  function onReady() {
    const g = globe.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = !paused;
    controls.autoRotateSpeed = 0.35;
    controls.enableZoom = false;
    g.pointOfView({ lat: 18, lng: 12, altitude: size.width < 600 ? 3 : 2.4 });
  }

  const empty = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)";

  return (
    <div className="globe" ref={box}>
      {size.width > 0 && (
        <ReactGlobe
          ref={globe}
          onGlobeReady={onReady}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={ocean(theme === "dark" ? "#0d0f17" : "#e9ebf3")}
          showAtmosphere
          atmosphereColor="#6366f1"
          atmosphereAltitude={0.16}
          polygonsData={shapes}
          polygonAltitude={(f) => (f === hover ? 0.03 : 0.008)}
          polygonCapColor={(f) => {
            const c = byIso.get((f as Feature).properties.iso3);
            return c ? shade(c.shares[topic] ?? 0, theme) : empty;
          }}
          polygonSideColor={() => "rgba(99,102,241,0.15)"}
          polygonStrokeColor={(f) =>
            byIso.get((f as Feature).properties.iso3)?.experimental
              ? "#f59e0b"
              : theme === "dark"
                ? "rgba(255,255,255,0.18)"
                : "rgba(15,23,42,0.18)"
          }
          polygonLabel={(f) => {
            const p = (f as Feature).properties;
            const c = byIso.get(p.iso3);
            if (!c)
              return `<div class="globe-tip"><b>${escapeHtml(p.name)}</b><br/>Not simulated</div>`;
            return `<div class="globe-tip"><b>${escapeHtml(c.name)}</b> · tier ${c.tier}${
              c.experimental ? " · experimental" : ""
            }<br/>${escapeHtml(topicLabel(topic))}: ${pct(c.shares[topic] ?? 0)} lean yes<br/><span>Click to read one agent</span></div>`;
          }}
          onPolygonHover={(f) => setHover(f as Feature | null)}
          onPolygonClick={(f) => {
            const c = byIso.get((f as Feature).properties.iso3);
            if (c) onSelect(c);
          }}
          polygonsTransitionDuration={300}
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
            style={{ background: `linear-gradient(90deg, ${shade(0, theme)}, ${shade(1, theme)})` }}
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

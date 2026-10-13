import { type ReactNode, useCallback, useState } from "react";

// Hand-drawn SVG on the design tokens: no chart dependency. Every chart draws in a box as wide as
// its container in pixels (360 until measured), so 12px text stays 12px at every width; the
// numbers always sit in a data table behind the drawing.
export type Point = { x: string; y: number; low?: number; high?: number };

const W0 = 360;

/** The svg's drawn width in px, so one viewBox unit is one pixel. */
function useWidth() {
  const [w, setW] = useState(W0);
  const ref = useCallback((el: SVGSVGElement | null) => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const px = Math.round(e.contentRect.width);
      if (px > 0) setW(px);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
const PAD = { l: 48, r: 12, t: 12, b: 28 };
const TICKS = 4;
const plain = (v: number) => String(Number(v.toPrecision(3)));
const span = (lo: number, hi: number): [number, number] =>
  lo === hi ? [lo - 1, hi + 1] : [lo, hi];
const ticks = ([lo, hi]: [number, number]) =>
  Array.from({ length: TICKS }, (_, i) => lo + ((hi - lo) * i) / (TICKS - 1));
const scale =
  ([lo, hi]: [number, number], a: number, b: number) =>
  (v: number) =>
    a + ((v - lo) / (hi - lo)) * (b - a);
/** At most `max` indexes of `n`: the first, every step-th and the last, never closer than half a step. */
const sparse = (n: number, max = 4) => {
  const step = Math.max(1, Math.ceil((n - 1) / (max - 1)));
  const last = n - 1;
  const at = Array.from({ length: n }, (_, i) => i).filter(
    (i) => i % step === 0 && (i === 0 || last - i >= step / 2),
  );
  return new Set(last > 0 ? [...at, last] : at);
};

function Frame({
  title,
  enough,
  label,
  width,
  svgRef,
  height,
  head,
  rows,
  children,
}: {
  title: string;
  enough: boolean;
  label: string;
  width: number;
  svgRef: (el: SVGSVGElement | null) => void;
  height: number;
  head: string[];
  rows: ReactNode[][];
  children: ReactNode;
}) {
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      {enough ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title}. ${label}`}
        >
          {children}
        </svg>
      ) : (
        <p className="muted small">Not enough data to draw this chart.</p>
      )}
      <details open={!enough}>
        <summary>Data table</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: rows are static and ordered
                <tr key={i}>
                  {r.map((c, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are static and ordered
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

const Ref = ({ y, x1, x2 }: { y: number; x1: number; x2: number }) => (
  <line className="chart-ref" x1={x1} x2={x2} y1={y} y2={y} />
);

/** A line over `points` with a low-high band where given; `reference` draws a dashed line. */
export function Trajectory(p: {
  title: string;
  points: Point[];
  yLabel?: string;
  domain?: [number, number];
  format?: (y: number) => string;
  reference?: number;
}) {
  const [svgRef, W] = useWidth();
  const f = p.format ?? plain;
  const H = 220;
  const all = p.points.flatMap((q) => [q.y, q.low ?? q.y, q.high ?? q.y]);
  if (p.reference !== undefined) all.push(p.reference);
  const dom = p.domain ?? span(Math.min(...all), Math.max(...all));
  const y = scale(dom, H - PAD.b, PAD.t);
  const n = p.points.length;
  const x = (i: number) => PAD.l + (n < 2 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r));
  const band = p.points.every((q) => q.low !== undefined && q.high !== undefined);
  const upper = p.points.map((q, i) => `${x(i)},${y(q.high ?? q.y)}`);
  const lower = p.points.map((q, i) => `${x(i)},${y(q.low ?? q.y)}`).reverse();
  const keep = sparse(n);
  return (
    <Frame
      title={p.title}
      width={W}
      svgRef={svgRef}
      enough={n >= 2}
      height={H}
      label={`${n} points from ${p.points[0]?.x} to ${p.points.at(-1)?.x}, ${p.yLabel ?? "value"} from ${f(Math.min(...all))} to ${f(Math.max(...all))}.`}
      head={["Point", p.yLabel ?? "Value", "Low", "High"]}
      rows={p.points.map((q) => [
        q.x,
        f(q.y),
        q.low === undefined ? "" : f(q.low),
        q.high === undefined ? "" : f(q.high),
      ])}
    >
      {ticks(dom).map((t) => (
        <g key={t}>
          <line className="chart-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text className="chart-tick" x={PAD.l - 6} y={y(t)} textAnchor="end" dy="0.32em">
            {f(t)}
          </text>
        </g>
      ))}
      {p.reference !== undefined && <Ref y={y(p.reference)} x1={PAD.l} x2={W - PAD.r} />}
      {band && <path className="chart-band" d={`M${[...upper, ...lower].join("L")}Z`} />}
      <polyline
        className="chart-line"
        points={p.points.map((q, i) => `${x(i)},${y(q.y)}`).join(" ")}
      />
      {n <= 12 &&
        p.points.map((q, i) => (
          <circle key={q.x} className="chart-dot" cx={x(i)} cy={y(q.y)} r={2.5} />
        ))}
      {p.points.map(
        (q, i) =>
          keep.has(i) && (
            <text
              key={q.x}
              className="chart-tick"
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            >
              {q.x}
            </text>
          ),
      )}
    </Frame>
  );
}

/** Horizontal bars, one row each, with an optional low-high range over the bar. */
export function Bars(p: {
  title: string;
  rows: { label: string; value: number; low?: number; high?: number; note?: string }[];
  domain?: [number, number];
  format?: (v: number) => string;
  reference?: number;
}) {
  const [svgRef, W] = useWidth();
  const f = p.format ?? plain;
  const ROW = 44;
  const top = 8;
  const H = top + p.rows.length * ROW + 24;
  const all = p.rows.flatMap((r) => [r.value, r.low ?? r.value, r.high ?? r.value, 0]);
  if (p.reference !== undefined) all.push(p.reference);
  const dom = p.domain ?? span(Math.min(...all), Math.max(...all));
  const x = scale(dom, PAD.r, W - PAD.r);
  const base = x(Math.max(dom[0], Math.min(0, dom[1])));
  return (
    <Frame
      title={p.title}
      width={W}
      svgRef={svgRef}
      enough={p.rows.length >= 1}
      height={H}
      label={`${p.rows.length} rows, values from ${f(Math.min(...p.rows.map((r) => r.value)))} to ${f(Math.max(...p.rows.map((r) => r.value)))}.`}
      head={["Row", "Value", "Low", "High", "Note"]}
      rows={p.rows.map((r) => [
        r.label,
        f(r.value),
        r.low === undefined ? "" : f(r.low),
        r.high === undefined ? "" : f(r.high),
        r.note ?? "",
      ])}
    >
      {ticks(dom).map((t, i) => (
        <g key={t}>
          <line className="chart-grid" x1={x(t)} x2={x(t)} y1={top} y2={H - 24} />
          <text
            className="chart-tick"
            x={x(t)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === TICKS - 1 ? "end" : "middle"}
          >
            {f(t)}
          </text>
        </g>
      ))}
      {p.reference !== undefined && (
        <line className="chart-ref" x1={x(p.reference)} x2={x(p.reference)} y1={top} y2={H - 24} />
      )}
      {p.rows.map((r, i) => {
        const y0 = top + i * ROW;
        const bx = Math.min(base, x(r.value));
        const mid = y0 + 26;
        return (
          <g key={r.label}>
            <text className="chart-tick chart-label" x={PAD.r} y={y0 + 12}>
              {r.label}
            </text>
            <text className="chart-tick" x={W - PAD.r} y={y0 + 12} textAnchor="end">
              {f(r.value)}
            </text>
            <rect
              className="chart-bar"
              x={bx}
              y={mid - 6}
              width={Math.abs(x(r.value) - base)}
              height={12}
            />
            {r.low !== undefined && r.high !== undefined && (
              <g className="chart-range">
                <line x1={x(r.low)} x2={x(r.high)} y1={mid} y2={mid} />
                <line x1={x(r.low)} x2={x(r.low)} y1={mid - 5} y2={mid + 5} />
                <line x1={x(r.high)} x2={x(r.high)} y1={mid - 5} y2={mid + 5} />
              </g>
            )}
          </g>
        );
      })}
    </Frame>
  );
}

/** Points on two numeric axes, sized by `n` where given; `diagonal` draws y = x. */
export function Scatter(p: {
  title: string;
  points: { x: number; y: number; n?: number; label?: string }[];
  xLabel: string;
  yLabel: string;
  diagonal?: boolean;
  format?: (v: number) => string;
}) {
  const [svgRef, W] = useWidth();
  const f = p.format ?? plain;
  const H = 280;
  const xs = p.points.map((q) => q.x);
  const ys = p.points.map((q) => q.y);
  const both = p.diagonal ? span(Math.min(...xs, ...ys), Math.max(...xs, ...ys)) : null;
  const xd = both ?? span(Math.min(...xs), Math.max(...xs));
  const yd = both ?? span(Math.min(...ys), Math.max(...ys));
  const x = scale(xd, PAD.l, W - PAD.r);
  const y = scale(yd, H - PAD.b - 12, PAD.t);
  return (
    <Frame
      title={p.title}
      width={W}
      svgRef={svgRef}
      enough={p.points.length >= 2}
      height={H}
      label={`${p.points.length} points, ${p.xLabel} from ${f(xd[0])} to ${f(xd[1])}, ${p.yLabel} from ${f(yd[0])} to ${f(yd[1])}.`}
      head={["Point", p.xLabel, p.yLabel, "n"]}
      rows={p.points.map((q, i) => [q.label ?? String(i + 1), f(q.x), f(q.y), q.n ?? ""])}
    >
      {ticks(yd).map((t) => (
        <g key={t}>
          <line className="chart-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text className="chart-tick" x={PAD.l - 6} y={y(t)} textAnchor="end" dy="0.32em">
            {f(t)}
          </text>
        </g>
      ))}
      {ticks(xd).map((t, i) => (
        <text
          key={t}
          className="chart-tick"
          x={x(t)}
          y={H - PAD.b + 4}
          textAnchor={i === 0 ? "start" : i === TICKS - 1 ? "end" : "middle"}
        >
          {f(t)}
        </text>
      ))}
      {p.diagonal && (
        <line className="chart-ref" x1={x(xd[0])} y1={y(yd[0])} x2={x(xd[1])} y2={y(yd[1])} />
      )}
      {p.points.map((q, i) => (
        <circle
          // biome-ignore lint/suspicious/noArrayIndexKey: points are static and ordered
          key={i}
          className="chart-dot chart-dot-n"
          cx={x(q.x)}
          cy={y(q.y)}
          r={q.n === undefined ? 4 : Math.min(9, 3 + Math.sqrt(q.n) / 2)}
        />
      ))}
      <text className="chart-tick" x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle">
        {p.xLabel}
      </text>
      <text className="chart-tick" x={PAD.r} y={PAD.t - 2}>
        {p.yLabel}
      </text>
    </Frame>
  );
}

/** Counts per bin as adjacent bars. */
export function Histogram(p: {
  title: string;
  bins: { low: number; high: number; count: number }[];
  format?: (v: number) => string;
}) {
  const [svgRef, W] = useWidth();
  const f = p.format ?? plain;
  const H = 200;
  const lo = Math.min(...p.bins.map((b) => b.low));
  const hi = Math.max(...p.bins.map((b) => b.high));
  const x = scale(span(lo, hi), PAD.l, W - PAD.r);
  const yd: [number, number] = [0, Math.max(1, ...p.bins.map((b) => b.count))];
  const y = scale(yd, H - PAD.b, PAD.t);
  const total = p.bins.reduce((n, b) => n + b.count, 0);
  return (
    <Frame
      title={p.title}
      width={W}
      svgRef={svgRef}
      enough={p.bins.length >= 1}
      height={H}
      label={`${total} values in ${p.bins.length} bins from ${f(lo)} to ${f(hi)}.`}
      head={["From", "To", "Count"]}
      rows={p.bins.map((b) => [f(b.low), f(b.high), b.count])}
    >
      {ticks(yd).map((t) => (
        <g key={t}>
          <line className="chart-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
          <text className="chart-tick" x={PAD.l - 6} y={y(t)} textAnchor="end" dy="0.32em">
            {plain(t)}
          </text>
        </g>
      ))}
      {p.bins.map((b) => (
        <rect
          key={b.low}
          className="chart-bar"
          x={x(b.low) + 1}
          y={y(b.count)}
          width={Math.max(1, x(b.high) - x(b.low) - 2)}
          height={H - PAD.b - y(b.count)}
        />
      ))}
      {[...(p.bins.length ? sparse(p.bins.length + 1) : [])].map((i) => {
        const v = i < p.bins.length ? p.bins[i].low : p.bins[p.bins.length - 1].high;
        return (
          <text
            key={i}
            className="chart-tick"
            x={x(v)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === p.bins.length ? "end" : "middle"}
          >
            {f(v)}
          </text>
        );
      })}
    </Frame>
  );
}

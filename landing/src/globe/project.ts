// Where a latitude and longitude land on screen. Two views: the live globe, which repeats
// the projection cobe 2.0.1 uses internally (read from its source and checked against the
// elements cobe itself places, see project.test.ts and e2e), and the static poster, which is
// drawn by scripts/gen_globe_poster.py. The page needs both so a marker is a real button on
// the live globe and on the poster a visitor sees first, with no WebGL, or on save-data.

export interface View {
  /** Rotation about the vertical axis, radians (cobe `phi`). */
  phi: number;
  /** Tilt, radians (cobe `theta`). */
  theta: number;
  /** Zoom (cobe `scale`). 1 is the whole globe. */
  scale: number;
}

export interface Screen {
  /** 0 to 1 across the square canvas. */
  x: number;
  /** 0 to 1 down the square canvas. */
  y: number;
  /** False for a point on the far side of the globe. */
  visible: boolean;
}

/** cobe's sphere radius (0.8 of half the canvas) plus the marker elevation it uses by default. */
const MARKER_RADIUS = 0.8 + 0.05;

/** cobe's own conversion of [lat, lng] in degrees to a point on the unit sphere. */
function xyz(lat: number, lng: number): [number, number, number] {
  const r = (lat * Math.PI) / 180;
  const a = (lng * Math.PI) / 180 - Math.PI;
  const c = Math.cos(r);
  return [-c * Math.cos(a), Math.sin(r), c * Math.sin(a)];
}

/** The projection cobe uses for a marker on a square canvas. */
export function project(lat: number, lng: number, view: View): Screen {
  const [x0, y0, z0] = xyz(lat, lng);
  const x = x0 * MARKER_RADIUS;
  const y = y0 * MARKER_RADIUS;
  const z = z0 * MARKER_RADIUS;
  const ct = Math.cos(view.theta);
  const st = Math.sin(view.theta);
  const cp = Math.cos(view.phi);
  const sp = Math.sin(view.phi);
  const cx = cp * x + sp * z;
  const sy = sp * st * x + ct * y - cp * st * z;
  const depth = -sp * ct * x + st * y + cp * ct * z;
  return {
    x: (cx * view.scale + 1) / 2,
    y: (-sy * view.scale + 1) / 2,
    // cobe also keeps a marker visible when it sits on the rim, past the disc's edge.
    visible: depth >= 0 || cx * cx + sy * sy >= 0.64,
  };
}

/**
 * The view that puts a point at the middle of the globe. The projection is a rotation, so the
 * point that lands at the centre and faces the viewer is the third row of its matrix,
 * (-sin phi cos theta, sin theta, cos phi cos theta): solve that for phi and theta.
 */
export function centerOn(lat: number, lng: number, scale = 1): View {
  const [x, y, z] = xyz(lat, lng);
  return { phi: Math.atan2(-x, z), theta: Math.asin(y), scale };
}

// The poster: an orthographic view centred on LON0, LAT0 with the sphere at 240 of 500 units.
const POSTER = { lon0: -35, lat0: 25, radius: 240, size: 500 };

export function projectPoster(lat: number, lng: number): Screen {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180;
  const lon0 = (POSTER.lon0 * Math.PI) / 180;
  const lat0 = (POSTER.lat0 * Math.PI) / 180;
  const cosC = Math.sin(lat0) * Math.sin(la) + Math.cos(lat0) * Math.cos(la) * Math.cos(lo - lon0);
  const px = Math.cos(la) * Math.sin(lo - lon0);
  const py = Math.cos(lat0) * Math.sin(la) - Math.sin(lat0) * Math.cos(la) * Math.cos(lo - lon0);
  const half = POSTER.size / 2;
  return {
    x: (half + px * POSTER.radius) / POSTER.size,
    y: (half - py * POSTER.radius) / POSTER.size,
    visible: cosC > 0,
  };
}

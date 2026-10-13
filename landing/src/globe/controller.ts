// The globe's motion, as plain functions on a plain object so it can be tested without a
// browser: drag, inertia, a slow idle spin, zoom and reset. Globe.tsx owns the pointers and the
// canvas and calls these. Nothing here touches the DOM.
import type { View } from "./project";

export const MIN_SCALE = 1;
export const MAX_SCALE = 2.8;
const MAX_THETA = 1.2;
/** Share of the half-canvas that the sphere's radius takes (cobe draws it at 0.8). */
const SPHERE = 0.8;
/** Idle spin, radians per millisecond: about 6 degrees a second, slow enough to read the markers. */
const SPIN = 0.0001;
/** Time constant of the inertia, milliseconds: a flick coasts for about a second. */
const TAU = 320;
const STOP = 0.00002;
/** Time before the idle spin starts again after the visitor lets go. */
const IDLE_MS = 4000;
const RESET_MS = 360;

export interface Motion extends View {
  vPhi: number;
  vTheta: number;
  /** The idle spin waits until this time (ms). */
  spinAfter: number;
  tween: { from: View; to: View; start: number } | null;
}

export interface Options {
  /** prefers-reduced-motion: no idle spin, no inertia, resets are instant. */
  reduced: boolean;
  /**
   * The idle spin stops while the pointer or keyboard focus is on the globe and while a receipt
   * is open: a marker that drifts away cannot be tapped.
   */
  paused?: boolean;
}

export function createMotion(view: View): Motion {
  return { ...view, vPhi: 0, vTheta: 0, spinAfter: 0, tween: null };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clampTheta = (t: number) => clamp(t, -MAX_THETA, MAX_THETA);
export const clampScale = (s: number) => clamp(s, MIN_SCALE, MAX_SCALE);

/** Pixels the sphere's radius spans on screen at this zoom. */
function radiusPx(sizePx: number, scale: number): number {
  return SPHERE * (sizePx / 2) * scale;
}

/**
 * Turn the globe by a drag of (dx, dy) pixels so the surface follows the pointer. Dragging right
 * raises phi and dragging down raises theta (derived from the projection in project.ts).
 * A touch drag passes tilt = false: vertical movement belongs to the page scroll.
 */
export function dragBy(
  m: Motion,
  dx: number,
  dy: number,
  sizePx: number,
  dtMs: number,
  tilt: boolean,
  now: number,
): void {
  const r = radiusPx(sizePx, m.scale);
  const dPhi = dx / r;
  const dTheta = tilt ? dy / r : 0;
  m.phi += dPhi;
  m.theta = clampTheta(m.theta + dTheta);
  m.tween = null;
  m.spinAfter = now + IDLE_MS;
  if (dtMs > 0) {
    // A smoothed velocity, so one jittery sample does not become the flick.
    m.vPhi = 0.6 * m.vPhi + 0.4 * (dPhi / dtMs);
    m.vTheta = 0.6 * m.vTheta + 0.4 * (dTheta / dtMs);
  }
}

/** Let go of a drag. Reduced motion stops dead; otherwise the velocity coasts down in step(). */
export function release(m: Motion, opts: Options, now: number): void {
  if (opts.reduced) {
    m.vPhi = 0;
    m.vTheta = 0;
  }
  m.spinAfter = now + IDLE_MS;
}

/** Advance by dtMs. Returns true while anything is still moving (the caller can stop drawing). */
export function step(m: Motion, dtMs: number, now: number, opts: Options): boolean {
  if (m.tween) {
    const t = clamp((now - m.tween.start) / RESET_MS, 0, 1);
    const e = 1 - (1 - t) ** 3;
    const { from, to } = m.tween;
    m.phi = from.phi + shortest(to.phi - from.phi) * e;
    m.theta = from.theta + (to.theta - from.theta) * e;
    m.scale = from.scale + (to.scale - from.scale) * e;
    if (t >= 1) m.tween = null;
    return true;
  }
  let moving = false;
  if (Math.abs(m.vPhi) > STOP || Math.abs(m.vTheta) > STOP) {
    m.phi += m.vPhi * dtMs;
    m.theta = clampTheta(m.theta + m.vTheta * dtMs);
    const decay = Math.exp(-dtMs / TAU);
    m.vPhi *= decay;
    m.vTheta *= decay;
    if (Math.abs(m.vPhi) <= STOP) m.vPhi = 0;
    if (Math.abs(m.vTheta) <= STOP) m.vTheta = 0;
    moving = true;
  } else if (!opts.reduced && !opts.paused && now >= m.spinAfter) {
    m.phi += SPIN * dtMs;
    moving = true;
  }
  return moving;
}

/** The shortest signed angle equivalent to d, so a reset never spins the long way round. */
function shortest(d: number): number {
  const tau = Math.PI * 2;
  return ((((d + Math.PI) % tau) + tau) % tau) - Math.PI;
}

export function zoomBy(m: Motion, factor: number, now: number): void {
  m.scale = clampScale(m.scale * factor);
  m.tween = null;
  m.spinAfter = now + IDLE_MS;
}

/** Arrow keys and the like: a step in radians, not a drag. */
export function nudge(m: Motion, dPhi: number, dTheta: number, now: number): void {
  m.phi += dPhi;
  m.theta = clampTheta(m.theta + dTheta);
  m.vPhi = 0;
  m.vTheta = 0;
  m.tween = null;
  m.spinAfter = now + IDLE_MS;
}

/** Go back to a view: animated, or at once under reduced motion. */
export function resetTo(m: Motion, to: View, opts: Options, now: number): void {
  m.vPhi = 0;
  m.vTheta = 0;
  m.spinAfter = now + IDLE_MS;
  if (opts.reduced) {
    m.phi = to.phi;
    m.theta = to.theta;
    m.scale = to.scale;
    m.tween = null;
    return;
  }
  m.tween = { from: { phi: m.phi, theta: m.theta, scale: m.scale }, to, start: now };
}

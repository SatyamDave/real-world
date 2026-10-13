import { expect, test } from "vitest";
import {
  createMotion,
  dragBy,
  MAX_SCALE,
  MIN_SCALE,
  nudge,
  release,
  resetTo,
  step,
  zoomBy,
} from "./controller";
import { centerOn, project } from "./project";

const calm = { reduced: true };
const full = { reduced: false };
const SIZE = 600;

test("dragging right moves a point under the pointer to the right, by the pixels dragged", () => {
  const view = centerOn(10, 10);
  const m = createMotion(view);
  const before = project(10, 10, m);
  dragBy(m, 30, 0, SIZE, 16, true, 0);
  const after = project(10, 10, m);
  // 30 pixels on a 600 pixel canvas is 0.05 of its width; the point sits at the centre, where
  // the surface moves at the pointer's speed.
  expect((after.x - before.x) * SIZE).toBeGreaterThan(28);
  expect((after.x - before.x) * SIZE).toBeLessThan(32);
});

test("dragging down moves a point at the centre down", () => {
  const m = createMotion(centerOn(10, 10));
  const before = project(10, 10, m);
  dragBy(m, 0, 30, SIZE, 16, true, 0);
  expect(project(10, 10, m).y).toBeGreaterThan(before.y);
});

test("a touch drag does not tilt: vertical movement belongs to the page scroll", () => {
  const m = createMotion(centerOn(10, 10));
  const theta = m.theta;
  dragBy(m, 20, 80, SIZE, 16, false, 0);
  expect(m.theta).toBe(theta);
});

test("tilt is clamped so the globe cannot flip over the pole", () => {
  const m = createMotion(centerOn(0, 0));
  dragBy(m, 0, 100000, SIZE, 16, true, 0);
  expect(m.theta).toBeLessThanOrEqual(1.2);
  dragBy(m, 0, -1000000, SIZE, 16, true, 0);
  expect(m.theta).toBeGreaterThanOrEqual(-1.2);
});

test("a flick coasts and settles; the same flick under reduced motion stops at once", () => {
  const flick = (opts: { reduced: boolean }) => {
    const m = createMotion(centerOn(0, 0));
    for (let i = 0; i < 6; i++) dragBy(m, 20, 0, SIZE, 16, true, i * 16);
    release(m, opts, 100);
    const start = m.phi;
    let now = 100;
    for (let i = 0; i < 200; i++) {
      now += 16;
      step(m, 16, now, opts);
    }
    return { moved: m.phi - start, v: m.vPhi };
  };
  const coasting = flick(full);
  expect(coasting.moved).toBeGreaterThan(0.1);
  expect(coasting.v).toBe(0);
  const calmFlick = flick(calm);
  expect(calmFlick.moved).toBe(0);
});

test("the idle spin waits after a touch and never runs under reduced motion", () => {
  const m = createMotion(centerOn(0, 0));
  nudge(m, 0.1, 0, 1000);
  const p = m.phi;
  step(m, 16, 2000, full); // inside the 4 s wait
  expect(m.phi).toBe(p);
  step(m, 16, 6000, full); // after it
  expect(m.phi).toBeGreaterThan(p);
  const r = createMotion(centerOn(0, 0));
  const q = r.phi;
  step(r, 16, 60000, calm);
  expect(r.phi).toBe(q);
});

test("the idle spin stops while the pointer or focus is on the globe, and starts again after", () => {
  const m = createMotion(centerOn(0, 0));
  const p = m.phi;
  step(m, 16, 60000, { reduced: false, paused: true });
  expect(m.phi).toBe(p);
  step(m, 16, 60016, { reduced: false, paused: false });
  expect(m.phi).toBeGreaterThan(p);
});

test("zoom is clamped at both ends", () => {
  const m = createMotion(centerOn(0, 0));
  for (let i = 0; i < 20; i++) zoomBy(m, 1.25, 0);
  expect(m.scale).toBe(MAX_SCALE);
  for (let i = 0; i < 40; i++) zoomBy(m, 0.8, 0);
  expect(m.scale).toBe(MIN_SCALE);
});

test("reset returns to the start view, animated by default and at once under reduced motion", () => {
  const home = centerOn(25, -35);
  const m = createMotion(home);
  dragBy(m, 200, 100, SIZE, 16, true, 0);
  zoomBy(m, 2, 0);
  resetTo(m, home, full, 0);
  expect(m.phi).not.toBe(home.phi); // not yet
  let now = 0;
  for (let i = 0; i < 40; i++) {
    now += 16;
    step(m, 16, now, full);
  }
  expect(Math.abs(m.phi - home.phi)).toBeLessThan(1e-9);
  expect(m.theta).toBeCloseTo(home.theta, 9);
  expect(m.scale).toBeCloseTo(home.scale, 9);

  const r = createMotion(home);
  dragBy(r, 200, 100, SIZE, 16, true, 0);
  resetTo(r, home, calm, 0);
  expect(r.phi).toBe(home.phi);
});

test("a reset takes the short way round", () => {
  const home = { phi: 0.1, theta: 0.2, scale: 1 };
  const m = createMotion({ phi: 0.1 + Math.PI * 2 - 0.2, theta: 0.2, scale: 1 }); // just short of a full turn away
  resetTo(m, home, full, 0);
  step(m, 16, 180, full);
  // Halfway through, it is still within 0.2 rad of where it began, not swinging through pi.
  expect(Math.abs(m.phi - (0.1 + Math.PI * 2 - 0.2))).toBeLessThan(0.3);
});

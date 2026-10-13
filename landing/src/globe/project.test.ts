import { expect, test } from "vitest";
import { centerOn, project, projectPoster } from "./project";

const close = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

test("a point at the centre of the view is at the middle of the canvas and visible", () => {
  for (const [lat, lng] of [
    [38.9, -77.04],
    [50.11, 8.68],
    [35.68, 139.69],
    [-33.9, 151.2],
  ]) {
    const v = centerOn(lat, lng);
    const p = project(lat, lng, v);
    close(p.x, 0.5);
    close(p.y, 0.5);
    expect(p.visible).toBe(true);
  }
});

test("the far side of the globe is not visible", () => {
  const v = centerOn(38.9, -77.04);
  expect(project(-38.9, 102.96, v).visible).toBe(false);
});

test("turning the globe so the surface moves right moves a point to the right", () => {
  const base = centerOn(0, 0);
  const a = project(0, 0, base);
  // A small rotation one way and the other: x moves opposite ways, y not at all at the equator.
  const plus = project(0, 0, { ...base, phi: base.phi + 0.05 });
  const minus = project(0, 0, { ...base, phi: base.phi - 0.05 });
  expect(Math.sign(plus.x - a.x)).toBe(-Math.sign(minus.x - a.x));
  expect(Math.abs(plus.x - a.x)).toBeGreaterThan(0.01);
  close(plus.y, a.y, 0.01);
});

test("zoom moves points away from the centre and leaves the centre alone", () => {
  const v = centerOn(20, 20);
  const near = project(25, 25, v);
  const zoomed = project(25, 25, { ...v, scale: 2 });
  expect(Math.abs(zoomed.x - 0.5)).toBeGreaterThan(Math.abs(near.x - 0.5));
  close(project(20, 20, { ...v, scale: 2 }).x, 0.5);
});

test("on the poster the centre of the projection is the middle, Washington and Frankfurt are in view, Tokyo is not", () => {
  const c = projectPoster(25, -35);
  close(c.x, 0.5);
  close(c.y, 0.5);
  expect(projectPoster(38.9, -77.04).visible).toBe(true);
  expect(projectPoster(50.11, 8.68).visible).toBe(true);
  expect(projectPoster(35.68, 139.69).visible).toBe(false);
  // Washington is left of centre and above it; Frankfurt is right of centre and above it.
  expect(projectPoster(38.9, -77.04).x).toBeLessThan(0.5);
  expect(projectPoster(50.11, 8.68).x).toBeGreaterThan(0.5);
  expect(projectPoster(50.11, 8.68).y).toBeLessThan(0.5);
});

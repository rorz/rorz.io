// biome-ignore-all lint/style/noMagicNumbers: fixtures reproduce the official validator's near-contact decisions.
import { expect, test } from "bun:test";
import { findCollisions, intersectionArea } from "./overlap.ts";
import { POLYGON_AREA_DEFICIT, polygonIntersectionArea } from "./polygon-overlap.ts";

test("borderline contacts agree with the official validator without relaxing the area tolerance", () => {
  // These six-decimal placements belong to an arrangement accepted by /packing/validate.
  const a = {
    fanId: "1",
    id: "1.1",
    theta: 2.069_737,
    x: 0.978_926,
    y: 0.546_421,
  };
  const b = {
    fanId: "2",
    id: "2.1",
    theta: 0.759_867,
    x: 2.009_519,
    y: 0.913_465,
  };
  const exact = intersectionArea(a, b);
  expect(exact).toBeGreaterThan(1e-6);
  expect(polygonIntersectionArea(a, b)).toBeLessThan(1e-6);
  expect(
    findCollisions([
      a,
      b,
    ]),
  ).toEqual([]);
  // One coordinate step inward must still be rejected.
  const penetrating = {
    ...b,
    x: b.x - 1e-6,
  };
  expect(polygonIntersectionArea(a, penetrating)).toBeGreaterThan(1e-6);
  expect(
    findCollisions([
      a,
      penetrating,
    ]),
  ).toHaveLength(1);
  expect(exact - polygonIntersectionArea(a, b)).toBeLessThan(POLYGON_AREA_DEFICIT);
});

test("polygon clipping retains the prescribed arc vertices, shared diameters, and translation invariance", () => {
  const a = {
    theta: 0,
    x: 0,
    y: 0,
  };
  const b = {
    theta: Math.PI,
    x: 1.9999,
    y: 0,
  };
  const shift = (shape: typeof a) => ({
    ...shape,
    x: shape.x + 100,
    y: shape.y - 100,
  });
  expect(polygonIntersectionArea(a, a)).toBeCloseTo(Math.PI / 2 - POLYGON_AREA_DEFICIT / 2, 12);
  expect(
    polygonIntersectionArea(a, {
      ...a,
      theta: Math.PI,
    }),
  ).toBeCloseTo(0, 12);
  expect(polygonIntersectionArea(a, b)).toBeCloseTo(
    polygonIntersectionArea(shift(a), shift(b)),
    12,
  );
  expect(polygonIntersectionArea(a, b)).toBeLessThan(intersectionArea(a, b));
});

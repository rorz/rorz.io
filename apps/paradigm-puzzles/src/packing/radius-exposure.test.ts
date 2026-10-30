// biome-ignore-all lint/style/noMagicNumbers: three fixed arc supports and a free interior semicircle.
import { expect, test } from "bun:test";
import { enclosingCircle } from "./enclosure.ts";
import type { Placement } from "./model.ts";
import { createRadiusWitnesses, retainedRadiusBound } from "./radius-exposure.ts";

const fixture = (): Placement[] => [
  ...[
    0,
    (2 * Math.PI) / 3,
    (4 * Math.PI) / 3,
  ].map((theta) => ({
    theta,
    x: 1.5 * Math.cos(theta),
    y: 1.5 * Math.sin(theta),
  })),
  {
    theta: 0,
    x: 0,
    y: 0,
  },
];

test("interior motion and small support rotations cannot pass a fixed-radius certificate", () => {
  const shapes = fixture();
  const circle = enclosingCircle(shapes);
  const witnesses = createRadiusWitnesses(shapes, circle);
  const candidate = shapes.map((shape, index) => ({
    theta: shape.theta + 1e-6,
    x: shape.x + (index === 3 ? 0.1 : 0),
    y: shape.y,
  }));
  expect(retainedRadiusBound(witnesses, candidate)).toBeGreaterThan(circle.radius - 1e-8);
});

test("inward support motion releases the certificate without claiming feasibility", () => {
  const shapes = fixture();
  const circle = enclosingCircle(shapes);
  const witnesses = createRadiusWitnesses(shapes, circle);
  const candidate = shapes.map((shape) => ({
    ...shape,
    x: shape.x * 0.95,
    y: shape.y * 0.95,
  }));
  expect(retainedRadiusBound(witnesses, candidate)).toBeLessThan(circle.radius - 1e-8);
  expect(enclosingCircle(candidate).radius).toBeLessThan(circle.radius - 1e-8);
});

test("turning a diameter endpoint outside the curved half removes that witness", () => {
  const shape = {
    theta: 0,
    x: 0,
    y: 0,
  };
  const witnesses = createRadiusWitnesses([
    shape,
  ]);
  shape.theta = 1e-3;
  expect(
    retainedRadiusBound(witnesses, [
      shape,
    ]),
  ).toBeLessThan(0.9);
});

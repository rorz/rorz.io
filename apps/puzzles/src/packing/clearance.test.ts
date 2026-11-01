// biome-ignore-all lint/style/noMagicNumbers: exact geometric fixtures and numerical tolerances.
import { expect, test } from "bun:test";
import { pairClearance } from "./clearance.ts";
import type { Placement } from "./model.ts";
import { intersectionArea } from "./overlap.ts";

test("signed clearance distinguishes arc gaps, penetration, and coincident/complementary halves", () => {
  const a = {
    theta: 0,
    x: 0,
    y: 0,
  };
  expect(
    pairClearance(a, {
      theta: Math.PI,
      x: 3,
      y: 0,
    }).gap,
  ).toBeCloseTo(1, 12);
  expect(
    pairClearance(a, {
      theta: Math.PI,
      x: 1.8,
      y: 0,
    }).gap,
  ).toBeCloseTo(-0.2, 12);
  expect(
    pairClearance(a, {
      theta: Math.PI,
      x: 2,
      y: 0,
    }).gap,
  ).toBeCloseTo(0, 12);
  expect(pairClearance(a, a).gap).toBeCloseTo(-1, 12);
  expect(
    pairClearance(a, {
      ...a,
      theta: Math.PI,
    }).gap,
  ).toBeCloseTo(0, 12);
});

test("flat faces and diameter endpoints produce actual nearest witnesses, including after rigid transforms", () => {
  const pairs: [
    Placement,
    Placement,
    number,
  ][] = [
    [
      {
        theta: 0,
        x: 0,
        y: 0,
      },
      {
        theta: Math.PI,
        x: -0.25,
        y: 0.3,
      },
      0.25,
    ],
    [
      {
        theta: Math.PI,
        x: 0,
        y: 0,
      },
      {
        theta: Math.PI,
        x: 1.2,
        y: 0,
      },
      0.2,
    ],
    [
      {
        theta: 0,
        x: 0,
        y: 0,
      },
      {
        theta: Math.PI,
        x: 0,
        y: 3,
      },
      1,
    ],
  ];
  const angle = 0.789;
  const transform = (p: Placement) => ({
    theta: p.theta + angle,
    x: 10 + p.x * Math.cos(angle) - p.y * Math.sin(angle),
    y: -7 + p.x * Math.sin(angle) + p.y * Math.cos(angle),
  });
  for (const [a, b, expected] of pairs) {
    for (const [first, second] of [
      [
        a,
        b,
      ],
      [
        transform(a),
        transform(b),
      ],
    ]) {
      if (!(first && second)) {
        throw new Error("Missing geometric fixture");
      }
      const result = pairClearance(first, second);
      expect(result.gap).toBeCloseTo(expected, 10);
      expect(
        Math.hypot(result.first.x - result.second.x, result.first.y - result.second.y),
      ).toBeCloseTo(expected, 10);
      expect(pairClearance(second, first).gap).toBeCloseTo(expected, 10);
    }
  }
});

test("clearance signs agree with independent analytic intersection areas across orientations", () => {
  for (let i = 1; i <= 100; i += 1) {
    const a = {
      theta: i * 0.731,
      x: 0,
      y: 0,
    };
    const b = {
      theta: i * 0.917,
      x: Math.sin(i * 1.29) * 2,
      y: Math.cos(i * 0.53) * 2,
    };
    const area = intersectionArea(a, b);
    const result = pairClearance(a, b);
    expect(area <= 1e-8 || result.gap < 0).toBe(true);
    expect(result.gap <= 1e-7 || area < 1e-10).toBe(true);
    const distance = Math.hypot(result.first.x - result.second.x, result.first.y - result.second.y);
    expect(result.gap <= 1e-7 || Math.abs(distance - result.gap) < 1e-9).toBe(true);
  }
});

test("clearance magnitude agrees with a numerical support search, including penetration", () => {
  const support = (shape: Placement, angle: number) =>
    Math.cos(angle - shape.theta) >= 0 ? 1 : Math.abs(Math.sin(angle - shape.theta));
  const step = (2 * Math.PI) / 1024;
  for (let i = 1; i <= 40; i += 1) {
    const a = {
      theta: i * 0.731,
      x: 0,
      y: 0,
    };
    const b = {
      theta: i * 0.917,
      x: Math.sin(i * 1.29) * 3,
      y: Math.cos(i * 0.53) * 3,
    };
    const separation = (angle: number) =>
      b.x * Math.cos(angle) +
      b.y * Math.sin(angle) -
      support(a, angle) -
      support(b, angle + Math.PI);
    let bestAngle = 0;
    for (let j = 1; j < 1024; j += 1) {
      if (separation(j * step) > separation(bestAngle)) {
        bestAngle = j * step;
      }
    }
    let low = bestAngle - step;
    let high = bestAngle + step;
    for (let j = 0; j < 60; j += 1) {
      const left = low + (high - low) / 3;
      const right = high - (high - low) / 3;
      if (separation(left) < separation(right)) {
        low = left;
      } else {
        high = right;
      }
    }
    expect(pairClearance(a, b).gap).toBeCloseTo(separation((low + high) / 2), 9);
  }
});

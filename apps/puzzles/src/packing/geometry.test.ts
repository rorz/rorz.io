// biome-ignore-all lint/style/noMagicNumbers: explicit fixtures exercise geometric edge cases.
import { expect, test } from "bun:test";
import { enclosingCircle, farthestPoint } from "./enclosure.ts";
import { exportPlacements, generateShapes, initialScene, makeFan, updateFan } from "./model.ts";
import { intersectionArea } from "./overlap.ts";

test("coincident, complementary, and perpendicular halves have the correct area", () => {
  const a = {
    theta: 0,
    x: 0,
    y: 0,
  };
  expect(intersectionArea(a, a)).toBeCloseTo(Math.PI / 2, 12);
  expect(
    intersectionArea(a, {
      ...a,
      theta: Math.PI,
    }),
  ).toBeCloseTo(0, 12);
  expect(
    intersectionArea(a, {
      ...a,
      theta: Math.PI / 2,
    }),
  ).toBeCloseTo(Math.PI / 4, 12);
});

test("arc intersections match the analytic lens and distinguish tangency from penetration", () => {
  const a = {
    theta: 0,
    x: 0,
    y: 0,
  };
  const b = {
    theta: Math.PI,
    x: 1,
    y: 0,
  };
  expect(intersectionArea(a, b)).toBeCloseTo((2 * Math.PI) / 3 - Math.sqrt(3) / 2, 12);
  expect(
    intersectionArea(a, {
      ...b,
      x: 2,
    }),
  ).toBe(0);
  expect(
    intersectionArea(a, {
      ...b,
      x: 1.999,
    }),
  ).toBeGreaterThan(1e-6);
  expect(
    intersectionArea(a, {
      ...b,
      x: 1.999_99,
    }),
  ).toBeLessThan(1e-6);
});

test("diameter clipping handles shared edges and rigid transforms", () => {
  const a = {
    theta: 0,
    x: 0,
    y: 0,
  };
  const b = {
    theta: 0,
    x: 0.25,
    y: 0.2,
  };
  const angle = 1.234;
  const rotate = (shape: typeof a) => ({
    theta: shape.theta + angle,
    x: 10 + shape.x * Math.cos(angle) - shape.y * Math.sin(angle),
    y: -7 + shape.x * Math.sin(angle) + shape.y * Math.cos(angle),
  });
  expect(intersectionArea(a, b)).toBeCloseTo(intersectionArea(b, a), 12);
  expect(intersectionArea(rotate(a), rotate(b))).toBeCloseTo(intersectionArea(a, b), 12);
  expect(
    intersectionArea(a, {
      theta: Math.PI,
      x: 0,
      y: 0.2,
    }),
  ).toBeCloseTo(0, 12);
});

test("enclosure follows translated unit halves and symmetric full disks", () => {
  const one = enclosingCircle([
    {
      theta: 0.37,
      x: 4,
      y: -2,
    },
  ]);
  expect(one.x).toBeCloseTo(4, 9);
  expect(one.y).toBeCloseTo(-2, 9);
  expect(one.radius).toBeCloseTo(1, 9);
  const disks = [
    -2,
    2,
  ].flatMap((x) =>
    [
      0,
      Math.PI,
    ].map((theta) => ({
      theta,
      x,
      y: 0,
    })),
  );
  expect(enclosingCircle(disks).radius).toBeCloseTo(3, 9);
});

test("enclosure bounds every curved boundary even for asymmetric fans", () => {
  const shapes = generateShapes({
    fans: [
      {
        ...makeFan("1"),
        count: 7,
        orbit: 2.3,
        phase: 17,
        spread: 153,
        x: -1.2,
      },
    ],
    linked: false,
  });
  const circle = enclosingCircle(shapes);
  expect(circle.error).toBeLessThan(1e-8);
  for (const shape of shapes) {
    const farthest = farthestPoint(shape, circle);
    expect(Math.hypot(farthest.x - circle.x, farthest.y - circle.y)).toBeLessThanOrEqual(
      circle.radius + 1e-12,
    );
  }
});

test("fan spacing and exported radians obey the puzzle contract at six decimals", () => {
  const ring = {
    ...makeFan("1"),
    count: 4,
    orbit: 2,
    tilt: 0,
  };
  const shapes = generateShapes({
    fans: [
      ring,
    ],
    linked: false,
  });
  expect(exportPlacements(shapes)).toEqual([
    {
      theta: 0,
      x: 2,
      y: 0,
    },
    {
      theta: 1.570_796,
      x: 0,
      y: 2,
    },
    {
      // biome-ignore lint/suspicious/noApproximativeNumericConstant: test the six-decimal value inside the ±π branch cut.
      theta: -3.141_592,
      x: -2,
      y: 0,
    },
    {
      theta: -1.570_796,
      x: 0,
      y: -2,
    },
  ]);
  const partial = generateShapes({
    fans: [
      {
        ...ring,
        count: 3,
        spread: 180,
      },
    ],
    linked: false,
  });
  expect(partial.at(-1)?.x).toBe(-2);
  const linked = updateFan(initialScene(), "1", {
    tilt: -30,
  });
  expect(linked.fans.every((fan) => fan.tilt === -30)).toBe(true);
  for (const shape of [
    ...shapes,
    ...generateShapes(linked),
  ]) {
    expect(Math.abs(shape.theta)).toBeLessThan(Math.PI);
    const normalized = Math.atan2(Math.sin(shape.theta), Math.cos(shape.theta));
    expect(Number(normalized.toFixed(6))).toBe(shape.theta);
  }
  const [contact] = generateShapes({
    fans: [
      {
        ...ring,
        count: 1,
        phase: 200,
        tilt: (4.001_234_6 * 180) / Math.PI - 200,
      },
    ],
    linked: false,
  });
  // Rounding in 0…2π first produces −2.281950 after a second normalization.
  expect(contact?.theta).toBe(-2.281_951);
});

test("full precision preserves the geometry and JSON while puzzle geometry still rounds by default", () => {
  const orbit = 1.234_567_49;
  const scene = {
    fans: [
      {
        ...makeFan("1"),
        count: 2,
        orbit,
        tilt: 0,
      },
    ],
    linked: false,
  };
  const original = structuredClone(scene);
  const unrounded = generateShapes(scene, true);
  const puzzle = generateShapes(scene);
  expect(unrounded[0]?.x).toBe(orbit);
  expect(exportPlacements(unrounded)[0]?.x).toBe(orbit);
  expect(enclosingCircle(unrounded).radius).toBeCloseTo(1 + orbit, 12);
  expect(puzzle[0]?.x).toBe(1.234_567);
  expect(enclosingCircle(puzzle).radius).toBeCloseTo(2.234_567, 12);
  expect(scene).toEqual(original);
});

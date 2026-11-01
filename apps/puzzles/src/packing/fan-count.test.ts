// biome-ignore-all lint/style/noMagicNumbers: reported packing coordinates and geometric tolerances.
import { expect, test } from "bun:test";
import { generateShapes, makeFan, removeLastSemicircle, type Scene, updateFan } from "./model.ts";
import { advanceExploration, createExploration } from "./search-restarts.ts";
import { defaultTightenOptions } from "./search-space.ts";
import { evaluateScene } from "./tighten.ts";

// Reconstructed from the user's 12 + 4 placement JSON, rounded to editor precision.
const fourLobes = (): Scene => ({
  fans: [
    {
      ...makeFan("1"),
      count: 12,
      orbit: 2.107_83,
      phase: 108.748_543,
      tilt: 51.412_928,
    },
    {
      ...makeFan("2"),
      count: 4,
      orbit: 1.417_78,
      phase: -5.369_237,
      tilt: -176.018_389,
    },
  ],
  linked: false,
});

test("removing one from the reported 12 + 4 packing preserves a valid 15-shape incumbent", () => {
  const original = fourLobes();
  const outer = original.fans[0];
  if (!outer) {
    throw new Error("Missing outer fan fixture");
  }
  const before = evaluateScene(original);
  expect(before.overlaps).toBe(0);
  const redistributed = evaluateScene(
    updateFan(original, outer.id, {
      count: 11,
    }),
  );
  expect(redistributed.overlaps).toBe(6);
  const reduced = updateFan(original, outer.id, removeLastSemicircle(outer));
  const shapes = generateShapes(reduced);
  expect(shapes).toEqual(generateShapes(original).filter((shape) => shape.id !== "1.12"));
  expect(shapes).toHaveLength(15);
  expect(reduced.fans[0]?.spread).toBe(300);
  const after = evaluateScene(reduced);
  expect(after.overlaps).toBe(0);
  expect(after.radius).toBeLessThanOrEqual(before.radius + 1e-8);

  const search = createExploration(reduced, defaultTightenOptions());
  let radius = search.best.radius;
  let preserved = true;
  for (let index = 0; index < 3000; index += 1) {
    advanceExploration(search);
    preserved &&= search.best.overlaps === 0 && search.best.radius <= radius;
    radius = search.best.radius;
  }
  expect(preserved).toBe(true);
  expect(search.restarts).toBeGreaterThan(0);
  expect(search.best.radius).toBeLessThanOrEqual(before.radius + 1e-8);
  expect(original.fans[0]?.count).toBe(12);
});

test("repeated endpoint deletion preserves transformed partial fans down to one semicircle", () => {
  const original = {
    ...makeFan("1"),
    count: 7,
    holdTilt: true,
    orbit: 1.23,
    phase: -123.4,
    spread: 123.456,
    tilt: 54.321,
    x: -2.34,
    y: 5.67,
  };
  let fan = original;
  const placements = generateShapes({
    fans: [
      original,
    ],
    linked: false,
  });
  while (fan.count > 1) {
    fan = {
      ...fan,
      ...removeLastSemicircle(fan),
    };
    expect(
      generateShapes({
        fans: [
          fan,
        ],
        linked: false,
      }),
    ).toEqual(placements.slice(0, fan.count));
    expect(fan.holdTilt).toBe(true);
  }
  expect(fan.spread).toBe(0);
  expect(removeLastSemicircle(fan)).toEqual(fan);
  expect(original.count).toBe(7);
});

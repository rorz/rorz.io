// biome-ignore-all lint/style/noMagicNumbers: the user's 3.028127 regression and bounded solver iterations.
import { expect, test } from "bun:test";
import { generateShapes, makeFan, type Scene } from "./model.ts";
import { advanceRelax, createRelax } from "./relax.ts";
import { splitForRelax, symmetryIssue } from "./relax-groups.ts";
import { defaultTightenOptions } from "./search-space.ts";

const threeLobes = (): Scene => ({
  fans: [
    {
      ...makeFan("1"),
      count: 3,
      orbit: 1.155_273_512_883_421,
      phase: -148.936_151_036_730_37,
      tilt: -167.537_734_957_448_27,
    },
    {
      ...makeFan("2"),
      count: 12,
      orbit: 2.028_126_697_117_317_5,
      phase: -101.105_845_982_749_8,
      tilt: 57.263_613_561_260_97,
    },
  ],
  linked: false,
});

test("threefold splitting preserves the input placement set and rejects incompatible symmetry", () => {
  const scene = threeLobes();
  const grouped = splitForRelax(scene, true);
  expect(grouped.fans).toHaveLength(5);
  expect(grouped.fans.every((fan) => fan.count === 3 && fan.spread === 360)).toBe(true);
  const original = generateShapes(scene);
  for (const shape of generateShapes(grouped)) {
    const nearest = original.toSorted(
      (a, b) => Math.hypot(a.x - shape.x, a.y - shape.y) - Math.hypot(b.x - shape.x, b.y - shape.y),
    )[0];
    expect(nearest?.x).toBeCloseTo(shape.x, 5);
    expect(nearest?.y).toBeCloseTo(shape.y, 5);
    expect(nearest?.theta).toBeCloseTo(shape.theta, 5);
  }
  scene.fans[1] = {
    ...makeFan("2"),
    count: 11,
  };
  expect(() => splitForRelax(scene, true)).toThrow("divisible by 3");
  scene.fans[1] = {
    ...makeFan("2"),
    x: 1,
  };
  expect(symmetryIssue(scene, true)).toContain("same origin");
  expect(scene.fans[0]?.count).toBe(3);
});

test("coordinated relaxation improves the reported stall while preserving every valid incumbent and threefold symmetry", () => {
  const scene = threeLobes();
  const original = structuredClone(scene);
  const search = createRelax(scene, defaultTightenOptions(), true);
  const repeated = createRelax(scene, defaultTightenOptions(), true);
  let radius = search.best.radius;
  let preserved = true;
  for (let i = 0; i < 2000; i += 1) {
    advanceRelax(search);
    advanceRelax(repeated);
    preserved &&= search.best.overlaps === 0 && search.best.radius <= radius;
    radius = search.best.radius;
  }
  expect(preserved).toBe(true);
  expect(search.restarts).toBeGreaterThan(0);
  expect(search.best).toEqual(repeated.best);
  expect(search.best.radius).toBeLessThan(3);
  expect(search.best.scene.fans).toHaveLength(5);
  expect(
    search.best.scene.fans.every(
      (fan) => fan.count === 3 && fan.spread === 360 && fan.x === 0 && fan.y === 0,
    ),
  ).toBe(true);
  expect(generateShapes(search.best.scene)).toHaveLength(15);
  expect(scene).toEqual(original);
});

test("free relaxation preserves partial-fan placements, disabled fields, and held tilt", () => {
  const scene: Scene = {
    fans: [
      {
        ...makeFan("1"),
        count: 2,
        holdTilt: true,
        orbit: 3,
        phase: 17,
        spread: 123,
      },
    ],
    linked: false,
  };
  const split = splitForRelax(scene, false);
  const original = generateShapes(scene);
  const shapes = generateShapes(split);
  expect(
    shapes.map(({ x, y, theta }) => ({
      theta,
      x,
      y,
    })),
  ).toEqual(
    original.map(({ x, y, theta }) => ({
      theta,
      x,
      y,
    })),
  );
  const options = {
    ...defaultTightenOptions(),
    phase: false,
  };
  const first = createRelax(scene, options, false);
  const second = createRelax(scene, options, false);
  for (let i = 0; i < 1200; i += 1) {
    advanceRelax(first);
    advanceRelax(second);
  }
  expect(first.best).toEqual(second.best);
  expect(first.best.scene.fans.every((fan) => fan.tilt === 75 && fan.holdTilt)).toBe(true);
  expect(first.best.scene.fans.map((fan) => fan.phase)).toEqual(split.fans.map((fan) => fan.phase));
  const frozen = createRelax(
    scene,
    {
      ...options,
      orbit: false,
    },
    false,
  );
  expect(frozen.finished).toBe(true);
  expect(advanceRelax(frozen).best.scene).toEqual(scene);
});

test("independent relaxation improves the symmetric seed and an expired deadline leaves the incumbent intact", () => {
  const search = createRelax(threeLobes(), defaultTightenOptions(), false);
  const original = structuredClone(search.best);
  advanceRelax(search, performance.now() - 1);
  expect(search.best).toEqual(original);
  expect(search.iterations).toBe(0);
  let previous = search.best.radius;
  let preserved = true;
  for (let i = 0; i < 2000; i += 1) {
    advanceRelax(search);
    preserved &&= search.best.overlaps === 0 && search.best.radius <= previous;
    previous = search.best.radius;
  }
  expect(preserved).toBe(true);
  expect(search.best.radius).toBeLessThan(3);
  expect(search.best.scene.fans).toHaveLength(15);
  expect(search.best.scene.fans.every((fan) => fan.count === 1)).toBe(true);
});

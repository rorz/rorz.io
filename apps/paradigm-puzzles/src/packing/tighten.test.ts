// biome-ignore-all lint/style/noMagicNumbers: search fixtures and acceptance tolerances.
import { expect, test } from "bun:test";
import { makeFan } from "./model.ts";
import { defaultTightenOptions } from "./search-space.ts";
import { advanceSearch, createSearch } from "./tighten.ts";

test("tightening lowers a feasible radius without accepting overlap or changing fixed fields", () => {
  const scene = {
    fans: [
      {
        ...makeFan("1"),
        count: 2,
        orbit: 2,
        tilt: 0,
      },
    ],
    linked: true,
  };
  const search = createSearch(scene, {
    ...defaultTightenOptions(),
    phase: false,
    tilt: false,
  });
  let previousRadius = search.best.radius;
  for (let index = 0; index < 500 && !search.finished; index += 1) {
    advanceSearch(search);
    expect(search.best.overlaps).toBe(0);
    expect(search.best.radius).toBeLessThanOrEqual(previousRadius);
    previousRadius = search.best.radius;
  }
  expect(search.best.radius).toBeCloseTo(1, 5);
  expect(search.best.scene.fans[0]).toMatchObject({
    count: 2,
    phase: 0,
    spread: 360,
    tilt: 0,
    x: 0,
    y: 0,
  });
  expect(scene.fans[0]?.orbit).toBe(2);
});

test("an overlapping start is repaired before minimizing radius", () => {
  const scene = {
    fans: [
      "1",
      "2",
    ].map((id) => ({
      ...makeFan(id),
      count: 1,
      orbit: 0,
      tilt: 0,
    })),
    linked: true,
  };
  const search = createSearch(scene, {
    ...defaultTightenOptions(),
    phase: false,
    tilt: false,
  });
  expect(search.best.overlaps).toBe(1);
  for (let index = 0; index < 1500 && !search.finished; index += 1) {
    advanceSearch(search);
  }
  expect(search.best.overlaps).toBe(0);
  expect(search.best.violation).toBe(0);
  expect(search.best.scene.fans.map((fan) => fan.count)).toEqual([
    1,
    1,
  ]);
});

test("orbit-only search contracts fans together when each independently supports the enclosure", () => {
  const scene = {
    fans: [
      0,
      90,
    ].map((phase, index) => ({
      ...makeFan(String(index + 1)),
      count: 2,
      orbit: 2,
      phase,
      tilt: 0,
    })),
    linked: true,
  };
  const search = createSearch(scene, {
    ...defaultTightenOptions(),
    phase: false,
    tilt: false,
  });
  for (let index = 0; index < 1000 && !search.finished; index += 1) {
    advanceSearch(search);
  }
  expect(search.best.radius).toBeLessThan(2.5);
  expect(search.best.overlaps).toBe(0);
  expect(search.best.scene.fans.map((fan) => fan.phase)).toEqual([
    0,
    90,
  ]);
});

test("search respects the shared tilt constraint and terminates when no fields are enabled", () => {
  const scene = {
    fans: [
      "1",
      "2",
    ].map((id) => ({
      ...makeFan(id),
      count: 1,
      orbit: 0,
    })),
    linked: true,
  };
  const options = {
    orbit: false,
    origins: false,
    phase: false,
    seconds: 1,
    spread: false,
    tilt: true,
  };
  const search = createSearch(scene, options);
  for (let index = 0; index < 100 && !search.finished; index += 1) {
    advanceSearch(search);
  }
  expect(search.best.scene.fans[0]?.tilt).toBe(search.best.scene.fans[1]?.tilt);
  const locked = createSearch(scene, {
    ...options,
    tilt: false,
  });
  expect(advanceSearch(locked).finished).toBe(true);
  expect(locked.best.scene).toEqual(scene);
});

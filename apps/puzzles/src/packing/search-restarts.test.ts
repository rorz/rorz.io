// biome-ignore-all lint/style/noMagicNumbers: reported regression and deterministic search budgets.
import { expect, test } from "bun:test";
import { makeFan, type Scene } from "./model.ts";
import { advanceExploration, createExploration } from "./search-restarts.ts";
import { defaultTightenOptions } from "./search-space.ts";
import { advanceSearch, createSearch } from "./tighten.ts";

const stalledPair = (): Scene => ({
  fans: [
    {
      ...makeFan("1"),
      count: 13,
      orbit: 2.111_518,
      phase: -1.014_648,
      tilt: 84.5,
    },
    {
      ...makeFan("2"),
      count: 2,
      orbit: 0,
      tilt: 84.5,
    },
  ],
  linked: true,
});

test("restarts escape the 13 + 2 stall without ever replacing the best valid arrangement with a worse trial", () => {
  const options = defaultTightenOptions();
  const local = createSearch(stalledPair(), options);
  for (let index = 0; index < 1000 && !local.finished; index += 1) {
    advanceSearch(local);
  }
  expect(local.best.radius).toBeGreaterThan(3.11);
  const search = createExploration(stalledPair(), options);
  let radius = search.best.radius;
  let preserved = true;
  for (let index = 0; index < 10_000; index += 1) {
    advanceExploration(search);
    preserved &&= search.best.overlaps === 0 && search.best.radius <= radius;
    radius = search.best.radius;
  }
  expect(preserved).toBe(true);
  expect(search.best.radius).toBeLessThan(3.09);
  expect(search.restarts).toBeGreaterThan(1);
  expect(search.finished).toBe(false);
});

test("identical settings and seed repeat the same search through multiple restarts", () => {
  const original = stalledPair();
  const snapshot = structuredClone(original);
  const first = createExploration(original, defaultTightenOptions());
  const second = createExploration(structuredClone(original), defaultTightenOptions());
  for (let index = 0; index < 2000; index += 1) {
    advanceExploration(first);
    advanceExploration(second);
  }
  expect(first.restarts).toBeGreaterThan(1);
  expect(first.best).toEqual(second.best);
  expect(first.evaluations).toBe(second.evaluations);
  expect(original).toEqual(snapshot);
});

test("local refinement and restarts hold the middle pair's tilt while preserving disabled parameters", () => {
  const scene = stalledPair();
  scene.linked = false;
  scene.fans[1] = {
    ...makeFan("2"),
    count: 2,
    holdTilt: true,
    orbit: 0.14,
    phase: -15,
    tilt: 90,
  };
  const search = createExploration(scene, defaultTightenOptions());
  let held = true;
  for (let index = 0; index < 2000; index += 1) {
    advanceExploration(search);
    held &&= search.local.best.scene.fans[1]?.tilt === 90;
  }
  expect(held).toBe(true);
  expect(search.restarts).toBeGreaterThan(0);
  expect(
    search.best.scene.fans.map(({ count, x, y, spread }) => ({
      count,
      spread,
      x,
      y,
    })),
  ).toEqual(
    scene.fans.map(({ count, x, y, spread }) => ({
      count,
      spread,
      x,
      y,
    })),
  );
  const linked = createExploration(
    {
      ...scene,
      fans: scene.fans.map((fan) => ({
        ...fan,
        tilt: 90,
      })),
      linked: true,
    },
    {
      ...defaultTightenOptions(),
      orbit: false,
      phase: false,
    },
  );
  expect(linked.finished).toBe(true);
});

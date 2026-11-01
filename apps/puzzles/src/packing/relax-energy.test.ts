// biome-ignore-all lint/style/noMagicNumbers: finite-difference verification of the contact derivatives.
import { expect, test } from "bun:test";
import { generateShapes, makeFan, type Scene } from "./model.ts";
import { packingEnergy } from "./relax-energy.ts";
import { createRelaxModel, movingShapes, relaxScene } from "./relax-model.ts";
import { defaultTightenOptions } from "./search-space.ts";

test("Cartesian search round-trips offset fan origins and still uses fan constraints when a tilt is held", () => {
  const scene = {
    fans: [
      {
        ...makeFan("1"),
        count: 3,
        orbit: 2.3,
        phase: 35,
        x: 4.2,
        y: -2.1,
      },
    ],
    linked: false,
  };
  const model = createRelaxModel(scene, defaultTightenOptions(), false);
  expect(model.cartesian).toBe(true);
  expect(model.freeCenter).toBe(false);
  expect(model.vector).toHaveLength(10);
  const original = generateShapes(scene);
  const restored = generateShapes(relaxScene(model, model.vector));
  for (const [i, shape] of restored.entries()) {
    expect(shape.x).toBeCloseTo(original[i]?.x ?? 0, 5);
    expect(shape.y).toBeCloseTo(original[i]?.y ?? 0, 5);
    expect(shape.theta).toBeCloseTo(original[i]?.theta ?? 0, 5);
  }
  const moved = [
    ...model.vector,
  ];
  const first = model.axes[0];
  if (first) {
    moved[first.orbit] = (moved[first.orbit] ?? 0) + 0.2;
  }
  const before = movingShapes(model, model.vector)[0];
  const after = movingShapes(model, moved)[0];
  expect(after?.x).toBeCloseTo((before?.x ?? 0) + 0.2);
  expect(after?.y).toBe(before?.y);
  expect(after?.theta).toBe(before?.theta);
  const held = {
    ...scene,
    fans: scene.fans.map((fan) => ({
      ...fan,
      holdTilt: true,
    })),
  };
  expect(createRelaxModel(held, defaultTightenOptions(), false).cartesian).toBe(false);
});

test("analytic contact and enclosure derivatives agree with finite differences, including shared tilts and free circle centers", () => {
  for (const threefold of [
    true,
    false,
  ]) {
    for (const linked of [
      true,
      false,
    ]) {
      const scene: Scene = {
        fans: [
          {
            ...makeFan("1"),
            orbit: 1.12,
            phase: 17,
            tilt: 82,
          },
          {
            ...makeFan("2"),
            orbit: 1.76,
            phase: -65,
            tilt: linked ? 82 : -21,
          },
        ],
        linked,
      };
      const model = createRelaxModel(scene, defaultTightenOptions(), threefold);
      const penalty = {
        multipliers: Array.from(
          {
            length: 21,
          },
          (_, i) => Math.abs(Math.sin(i)) * 3,
        ),
        weight: 100,
      };
      let worst = 0;
      for (let run = 0; run < 5; run += 1) {
        const vector = model.vector.map(
          (value, i) => value + 0.08 * Math.sin(i * 23.48 + run * 1.934),
        );
        const analytic = packingEnergy(model, vector, penalty);
        for (let axis = 0; axis < vector.length; axis += 1) {
          const plus = [
            ...vector,
          ];
          const minus = [
            ...vector,
          ];
          plus[axis] = (plus[axis] ?? 0) + 1e-6;
          minus[axis] = (minus[axis] ?? 0) - 1e-6;
          const numerical =
            (packingEnergy(model, plus, penalty).value -
              packingEnergy(model, minus, penalty).value) /
            2e-6;
          worst = Math.max(worst, Math.abs(numerical - (analytic.gradient[axis] ?? 0)));
        }
      }
      expect(worst).toBeLessThan(1e-4);
    }
  }
});

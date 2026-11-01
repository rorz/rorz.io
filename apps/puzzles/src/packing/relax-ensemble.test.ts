// biome-ignore-all lint/style/noMagicNumbers: replica exchange probabilities and geometric regression fixtures.
import { expect, test } from "bun:test";
import { makeFan } from "./model.ts";
import { createEnsemble, exchangeReplicas, nextEnsemble } from "./relax-ensemble.ts";
import { createRelaxModel, movingShapes } from "./relax-model.ts";
import { defaultTightenOptions } from "./search-space.ts";

test("replica exchanges move better basins toward colder slots and alternate adjacent pairs", () => {
  const state = createEnsemble({
    radius: 3,
    signature: "start",
    vector: [],
  });
  const [first, second, third] = state.replicas;
  if (!(first && second && third)) {
    throw new Error("Missing replica");
  }
  second.basin = {
    radius: 2.95,
    signature: "better",
    vector: [],
  };
  exchangeReplicas(state, () => 0.99);
  expect(first.basin.radius).toBe(2.95);
  expect(second.basin.radius).toBe(3);
  expect(first.temperature).toBe(0.002);
  expect(second.temperature).toBe(0.006);
  third.basin = {
    radius: 2.94,
    signature: "third",
    vector: [],
  };
  exchangeReplicas(state, () => 0.99);
  expect(first.basin.radius).toBe(2.95);
  expect(second.basin.radius).toBe(2.94);
  expect(third.basin.radius).toBe(3);
  exchangeReplicas(state, () => 0.99);
  expect(first.basin.radius).toBe(2.94);
});

test("larger valid trials can advance exploration without mutating the incumbent or its geometry", () => {
  const model = createRelaxModel(
    {
      fans: [
        {
          ...makeFan("1"),
          count: 2,
          orbit: 2,
          tilt: 0,
        },
      ],
      linked: false,
    },
    defaultTightenOptions(),
    false,
  );
  const best = {
    radius: model.circle.radius,
    signature: "best",
    vector: [
      ...model.vector,
    ],
  };
  const original = structuredClone(best);
  const vector = [
    ...model.vector,
  ];
  for (const axes of model.axes) {
    vector[axes.orbit] = (vector[axes.orbit] ?? 0) * 1.01 + 1.3;
    vector[axes.phase] = (vector[axes.phase] ?? 0) * 1.01 - 0.6;
  }
  const candidate = {
    radius: best.radius + 0.02,
    signature: "larger",
    vector,
  };
  const before = movingShapes(model, candidate.vector);
  const state = createEnsemble(best);
  const next = nextEnsemble(state, model, {
    best,
    candidate,
    random: () => 0,
    restart: 1,
  });
  const accepted = state.replicas[0]?.basin;
  expect(accepted?.radius).toBe(candidate.radius);
  expect(state.pool).toHaveLength(1);
  expect(state.active).toBe(1);
  expect(next[model.radiusAxis]).toBeGreaterThan(best.radius);
  expect(best).toEqual(original);
  const after = movingShapes(model, accepted?.vector ?? []);
  expect(after.map((shape) => shape.theta)).toEqual(before.map((shape) => shape.theta));
  expect(
    Math.hypot((after[0]?.x ?? 0) - (after[1]?.x ?? 0), (after[0]?.y ?? 0) - (after[1]?.y ?? 0)),
  ).toBeCloseTo(
    Math.hypot(
      (before[0]?.x ?? 0) - (before[1]?.x ?? 0),
      (before[0]?.y ?? 0) - (before[1]?.y ?? 0),
    ),
    12,
  );
});

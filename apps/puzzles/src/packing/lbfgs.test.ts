// biome-ignore-all lint/style/noMagicNumbers: Rosenbrock's coupled curved valley and bound-constrained fixtures.
import { expect, test } from "bun:test";
import { advanceMinimizer, createMinimizer } from "./lbfgs.ts";

test("the joint minimizer follows a curved valley without increasing its objective", () => {
  const objective = (vector: number[]) => {
    const [x = 0, y = 0] = vector;
    return {
      gradient: [
        -2 * (1 - x) - 400 * x * (y - x * x),
        200 * (y - x * x),
      ],
      value: (1 - x) ** 2 + 100 * (y - x * x) ** 2,
    };
  };
  const state = createMinimizer(
    [
      -1.2,
      1,
    ],
    objective,
  );
  const project = (vector: number[]) => vector;
  let previous = state.point.value;
  let monotonic = true;
  for (let i = 0; i < 1000 && !state.stalled; i += 1) {
    advanceMinimizer(state, objective, project);
    monotonic &&= state.point.value <= previous;
    previous = state.point.value;
  }
  expect(monotonic).toBe(true);
  expect(state.point.value).toBeLessThan(1e-10);
  expect(state.vector[0]).toBeCloseTo(1, 4);
  expect(state.vector[1]).toBeCloseTo(1, 4);
});

test("bounded steps stop at a constrained optimum and honor an expired deadline", () => {
  const objective = ([x = 0]: number[]) => ({
    gradient: [
      2 * (x + 1),
    ],
    value: (x + 1) ** 2,
  });
  const project = (vector: number[]) => vector.map((value) => Math.max(0, value));
  const state = createMinimizer(
    [
      2,
    ],
    objective,
  );
  advanceMinimizer(state, objective, project, performance.now() - 1);
  expect(state.vector).toEqual([
    2,
  ]);
  for (let i = 0; i < 20; i += 1) {
    advanceMinimizer(state, objective, project);
  }
  expect(state.vector).toEqual([
    0,
  ]);
  expect(state.stalled).toBe(true);
});

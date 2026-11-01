// biome-ignore-all lint/style/noMagicNumbers: deterministic pause/resume regression fixtures.
import { expect, test } from "bun:test";
import { makeFan } from "./model.ts";
import { advanceRelax, createRelax } from "./relax.ts";
import { canResumeRelax, checkpointRelax, restoreRelax } from "./relax-checkpoint.ts";
import { defaultTightenOptions } from "./search-space.ts";

test("resuming a serialized worker checkpoint follows the uninterrupted search exactly", () => {
  const options = {
    ...defaultTightenOptions(),
    threefold: false,
  };
  const scene = {
    fans: [
      {
        ...makeFan("1"),
        orbit: 3,
      },
    ],
    linked: false,
  };
  const uninterrupted = createRelax(scene, options, false);
  for (let i = 0; i < 700; i += 1) {
    advanceRelax(uninterrupted);
  }
  const checkpoint = JSON.parse(JSON.stringify(checkpointRelax(uninterrupted, options)));
  const restored = restoreRelax(checkpoint);
  for (let i = 0; i < 900; i += 1) {
    advanceRelax(uninterrupted);
    advanceRelax(restored);
  }
  expect(checkpointRelax(restored, options)).toEqual(checkpointRelax(uninterrupted, options));
  expect(checkpoint.iterations).toBe(700);
  expect(restored.restarts).toBeGreaterThan(0);
});

test("a new duration can continue, while changed geometry, constraints, or seed start afresh", () => {
  const options = defaultTightenOptions();
  const scene = {
    fans: [
      {
        ...makeFan("1"),
        orbit: 3,
      },
    ],
    linked: false,
  };
  const checkpoint = checkpointRelax(createRelax(scene, options, true), options);
  expect(
    canResumeRelax(checkpoint, scene, {
      ...options,
      seconds: 600,
    }),
  ).toBe(true);
  expect(
    canResumeRelax(checkpoint, scene, {
      ...options,
      seed: 43,
    }),
  ).toBe(false);
  expect(
    canResumeRelax(checkpoint, scene, {
      ...options,
      tilt: false,
    }),
  ).toBe(false);
  expect(
    canResumeRelax(checkpoint, scene, {
      ...options,
      threefold: false,
    }),
  ).toBe(false);
  const moved = structuredClone(scene);
  if (moved.fans[0]) {
    moved.fans[0].phase += 1;
  }
  expect(canResumeRelax(checkpoint, moved, options)).toBe(false);
  expect(canResumeRelax(undefined, scene, options)).toBe(false);
});

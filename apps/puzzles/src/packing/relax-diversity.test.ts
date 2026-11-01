// biome-ignore-all lint/style/noMagicNumbers: rotated, relabelled, and displaced geometry fixtures.
import { expect, test } from "bun:test";
import { packingFingerprint, samePacking } from "./relax-diversity.ts";
import { type Basin, rememberBasin } from "./relax-hopping.ts";

test("geometric diversity ignores labels and rigid motion, but notices a rebuilt piece", () => {
  const shapes = [
    {
      theta: 0,
      x: 0,
      y: 0,
    },
    {
      theta: 1.7,
      x: 1,
      y: 2,
    },
    {
      theta: 3,
      x: -2,
      y: 1,
    },
  ];
  const rotated = shapes.toReversed().map(({ x, y, theta }) => ({
    theta: theta + Math.PI / 2,
    x: 4 - y,
    y: -3 + x,
  }));
  const original = packingFingerprint(shapes);
  const duplicate = packingFingerprint(rotated);
  expect(samePacking(original, duplicate)).toBe(true);
  if (rotated[0]) {
    rotated[0].theta += 1;
  }
  expect(samePacking(original, packingFingerprint(rotated))).toBe(false);
  const pool: Basin[] = [
    {
      fingerprint: original,
      radius: 3,
      signature: "old labels",
      vector: [
        1,
      ],
    },
  ];
  rememberBasin(pool, {
    fingerprint: duplicate,
    radius: 3.000_01,
    signature: "new labels",
    vector: [
      2,
    ],
  });
  expect(pool).toHaveLength(1);
  expect(pool[0]?.vector).toEqual([
    1,
  ]);
  rememberBasin(pool, {
    fingerprint: duplicate,
    radius: 2.999,
    signature: "new labels",
    vector: [
      3,
    ],
  });
  expect(pool).toHaveLength(1);
  expect(pool[0]?.vector).toEqual([
    3,
  ]);
});

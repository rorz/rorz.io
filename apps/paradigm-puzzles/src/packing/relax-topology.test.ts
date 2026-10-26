// biome-ignore-all lint/style/noMagicNumbers: touching, perturbed, and relabelled geometry fixtures.
import { expect, test } from "bun:test";
import { packingTopology } from "./relax-topology.ts";

test("contact diversity survives relabelling, rigid motion, and small unsettled rotations", () => {
  const circle = {
    radius: 4,
    x: 0,
    y: 0,
  };
  const shapes = [
    {
      theta: 0,
      x: 0,
      y: 0,
    },
    {
      theta: Math.PI,
      x: 2,
      y: 0,
    },
    {
      theta: Math.PI,
      x: 2,
      y: 2,
    },
  ];
  const signature = packingTopology(shapes, circle);
  const rotated = shapes.toReversed().map(({ x, y, theta }) => ({
    theta: theta + Math.PI / 2,
    x: 5 - y,
    y: 7 + x,
  }));
  expect(
    packingTopology(rotated, {
      radius: 4,
      x: 5,
      y: 7,
    }),
  ).toBe(signature);
  if (shapes[1]) {
    shapes[1].theta += 0.03;
  }
  expect(packingTopology(shapes, circle)).toBe(signature);
  if (shapes[2]) {
    shapes[2].y += 0.1;
  }
  expect(packingTopology(shapes, circle)).not.toBe(signature);
  expect(
    packingTopology(shapes, {
      ...circle,
      radius: 2,
    }),
  ).not.toBe(packingTopology(shapes, circle));
});

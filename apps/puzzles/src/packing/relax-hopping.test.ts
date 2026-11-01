// biome-ignore-all lint/style/noMagicNumbers: reproducible basin-hopping and contact-topology fixtures.
import { expect, test } from "bun:test";
import { makeFan, type Scene } from "./model.ts";
import {
  acceptsBasin,
  type Basin,
  randomSource,
  rememberBasin,
  shakeBasin,
} from "./relax-hopping.ts";
import { createRelaxModel } from "./relax-model.ts";
import { parameterScene } from "./relax-space.ts";
import { defaultTightenOptions } from "./search-space.ts";

test("all shake types preserve locked coordinates and shared held tilts with a repeatable seed", () => {
  const scene: Scene = {
    fans: [
      {
        ...makeFan("1"),
        holdTilt: true,
        orbit: 3,
      },
      {
        ...makeFan("2"),
        orbit: 5,
      },
    ],
    linked: true,
  };
  const model = createRelaxModel(
    scene,
    {
      ...defaultTightenOptions(),
      orbit: false,
    },
    true,
  );
  const original = structuredClone(model.vector);
  const basin = {
    radius: model.circle.radius,
    signature: "original",
    vector: model.vector,
  };
  const first = randomSource(42);
  const second = randomSource(42);
  for (let restart = 0; restart < 10; restart += 1) {
    const options = {
      amplitude: 0.9,
      best: basin,
      pool: [
        basin,
      ],
      restart,
      walker: basin,
    };
    const vector = shakeBasin(model, {
      ...options,
      random: first,
    });
    expect(vector).toEqual(
      shakeBasin(model, {
        ...options,
        random: second,
      }),
    );
    const result = parameterScene(model.template, model.variables, vector);
    expect(result.fans.map((fan) => fan.orbit)).toEqual([
      3,
      5,
    ]);
    expect(
      result.fans.every((fan) => fan.tilt === 75 && fan.count === 3 && fan.x === 0 && fan.y === 0),
    ).toBe(true);
  }
  expect(model.vector).toEqual(original);
});

test("the exploration walker can accept uphill basins while its archive preserves the best distinct contacts", () => {
  expect(acceptsBasin(3, 3.1, 0.02, 0.9)).toBe(true);
  expect(acceptsBasin(3.01, 3, 0.02, 0.1)).toBe(true);
  expect(acceptsBasin(3.2, 3, 0.02, 0.9)).toBe(false);
  const pool: Basin[] = [];
  for (let i = 0; i < 12; i += 1) {
    rememberBasin(pool, {
      radius: 3 + i / 100,
      signature: String(i),
      vector: [
        i,
      ],
    });
  }
  rememberBasin(pool, {
    radius: 3.2,
    signature: "0",
    vector: [
      99,
    ],
  });
  expect(pool).toHaveLength(8);
  expect(pool[0]?.radius).toBe(3);
  expect(pool[0]?.vector).toEqual([
    0,
  ]);
  rememberBasin(pool, {
    radius: 2.99,
    signature: "1",
    vector: [
      42,
    ],
  });
  expect(pool[0]?.radius).toBe(2.99);
  expect(pool.filter((item) => item.signature === "1")).toHaveLength(1);
});

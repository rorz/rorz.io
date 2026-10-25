// biome-ignore-all lint/style/noMagicNumbers: persistence fixtures and validation boundaries.
import { expect, test } from "bun:test";
import type { EditorSettings } from "./editor-settings.ts";
import { initialScene, makeFan, updateFan } from "./model.ts";
import { defaultTightenOptions } from "./search-space.ts";
import { captureSnapshot, readSnapshots, SNAPSHOTS_KEY, updateSnapshots } from "./snapshots.ts";

const settings = (): EditorSettings => ({
  camera: {
    scale: 80,
    x: 1,
    y: -2,
  },
  display: {
    circle: true,
    grid: false,
    guides: true,
    labels: true,
  },
  inspector: true,
  inspectorTab: "scene",
  scene: updateFan(initialScene(), "2", {
    holdTilt: true,
  }),
  selectedId: "2",
  tighten: {
    ...defaultTightenOptions(),
    origins: true,
  },
});
const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

test("a named snapshot independently captures every editor setting and survives a round trip", () => {
  const storage = memoryStorage();
  const state = settings();
  const snapshot = captureSnapshot("  Experiment A  ", state);
  updateSnapshots(storage, () => [
    snapshot,
  ]);
  state.scene.fans[0] = {
    ...makeFan("1"),
    orbit: 9,
  };
  state.display.grid = true;
  state.camera = null;
  expect(readSnapshots(storage)[0]?.settings).toEqual(settings());
  expect(snapshot.name).toBe("Experiment A");
});

test("new saves merge with current storage instead of overwriting another tab's snapshot", () => {
  const storage = memoryStorage();
  const first = captureSnapshot("First", settings());
  const second = captureSnapshot("Second", settings());
  updateSnapshots(storage, () => [
    first,
  ]);
  updateSnapshots(storage, (current) => [
    second,
    ...current,
  ]);
  expect(readSnapshots(storage).map((item) => item.id)).toEqual([
    second.id,
    first.id,
  ]);
});

test("snapshots from before search seeds and per-fan holds remain loadable", () => {
  const storage = memoryStorage();
  const snapshot = captureSnapshot("Original format", settings());
  snapshot.settings.scene = initialScene();
  snapshot.settings.tighten = {
    orbit: true,
    origins: false,
    phase: true,
    seconds: 10,
    spread: false,
    tilt: true,
  };
  storage.setItem(
    SNAPSHOTS_KEY,
    JSON.stringify({
      items: [
        snapshot,
      ],
      version: 1,
    }),
  );
  expect(readSnapshots(storage)[0]).toEqual(snapshot);
});

test("invalid or future saved data is rejected without overwriting it", () => {
  const storage = memoryStorage();
  const snapshot = captureSnapshot("Test", settings());
  const corrupt = JSON.stringify({
    items: [
      snapshot,
    ],
    version: 2,
  });
  storage.setItem(SNAPSHOTS_KEY, corrupt);
  expect(() => updateSnapshots(storage, () => [])).toThrow("unsupported or invalid");
  expect(storage.getItem(SNAPSHOTS_KEY)).toBe(corrupt);
  snapshot.settings.scene.fans[0] = {
    ...makeFan("1"),
    count: 121,
  };
  storage.setItem(
    SNAPSHOTS_KEY,
    JSON.stringify({
      items: [
        snapshot,
      ],
      version: 1,
    }),
  );
  expect(() => readSnapshots(storage)).toThrow("unsupported or invalid");
});

test("storage quota failures are reported rather than presented as a successful save", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Quota exceeded");
    },
  };
  expect(() =>
    updateSnapshots(storage, () => [
      captureSnapshot("Test", settings()),
    ]),
  ).toThrow("Quota exceeded");
});

import type { EditorSettings, Snapshot } from "./editor-settings.ts";
import { parseSnapshots } from "./snapshot-schema.ts";
import { evaluateScene } from "./tighten.ts";

type SnapshotStorage = Pick<Storage, "getItem" | "setItem">;
const SNAPSHOTS_KEY = "paradigm-puzzles:shape-packing:snapshots:v1";
const readSnapshots = (storage: SnapshotStorage) => parseSnapshots(storage.getItem(SNAPSHOTS_KEY));
const updateSnapshots = (
  storage: SnapshotStorage,
  transform: (items: Snapshot[]) => Snapshot[],
) => {
  // Re-read before every mutation so a stale tab cannot discard another tab's saves.
  const items = transform(readSnapshots(storage));
  const serialized = JSON.stringify({
    items,
    version: 1,
  });
  parseSnapshots(serialized);
  storage.setItem(SNAPSHOTS_KEY, serialized);
  return items;
};
const captureSnapshot = (name: string, settings: EditorSettings): Snapshot => {
  const { radius, overlaps } = evaluateScene(settings.scene);
  return {
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    name: name.trim(),
    overlaps,
    radius,
    settings: structuredClone(settings),
  };
};

export { captureSnapshot, readSnapshots, SNAPSHOTS_KEY, updateSnapshots };

// biome-ignore-all lint/style/noMagicNumbers: persisted editor bounds and schema version.
import type { Display, Viewport } from "./draw.ts";
import type { EditorSettings, Snapshot } from "./editor-settings.ts";
import { type Fan, MAX_SHAPES, type Scene } from "./model.ts";
import type { TightenOptions } from "./search-space.ts";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const range = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const fanIdPattern = /^[1-9]\d*$/u;
const validFan = (value: unknown): value is Fan =>
  record(value) &&
  typeof value.id === "string" &&
  fanIdPattern.test(value.id) &&
  Number.isSafeInteger(Number(value.id)) &&
  range(value.count, 1, MAX_SHAPES) &&
  Number.isInteger(value.count) &&
  range(value.orbit, 0, 10) &&
  range(value.phase, -180, 360) &&
  range(value.spread, 0, 360) &&
  range(value.tilt, -180, 180) &&
  (value.holdTilt === undefined || typeof value.holdTilt === "boolean") &&
  range(value.x, -20, 20) &&
  range(value.y, -20, 20);
const validScene = (value: unknown): value is Scene => {
  if (!(record(value) && typeof value.linked === "boolean" && Array.isArray(value.fans))) {
    return false;
  }
  if (value.fans.length === 0 || !value.fans.every(validFan)) {
    return false;
  }
  const fans: Fan[] = value.fans;
  return (
    fans.reduce((sum, fan) => sum + fan.count, 0) <= MAX_SHAPES &&
    new Set(fans.map((fan) => fan.id)).size === fans.length &&
    (!value.linked || fans.every((fan) => fan.tilt === fans[0]?.tilt))
  );
};
const validDisplay = (value: unknown): value is Display =>
  record(value) &&
  [
    value.circle,
    value.grid,
    value.guides,
    value.labels,
  ].every((item) => typeof item === "boolean");
const validCamera = (value: unknown): value is Viewport | null =>
  value === null ||
  (record(value) &&
    range(value.scale, 1e-3, 2000) &&
    range(value.x, -1e9, 1e9) &&
    range(value.y, -1e9, 1e9));
const validOptions = (value: unknown): value is TightenOptions =>
  record(value) &&
  [
    value.orbit,
    value.origins,
    value.phase,
    value.spread,
    value.tilt,
  ].every((item) => typeof item === "boolean") &&
  range(value.seconds, 1, 60) &&
  (value.seed === undefined || (range(value.seed, 1, 999_999) && Number.isInteger(value.seed)));
const validSettings = (value: unknown): value is EditorSettings =>
  record(value) &&
  validScene(value.scene) &&
  validDisplay(value.display) &&
  validCamera(value.camera) &&
  typeof value.inspector === "boolean" &&
  typeof value.selectedId === "string" &&
  (value.inspectorTab === "placements" ||
    value.inspectorTab === "scene" ||
    value.inspectorTab === "diagnostics") &&
  value.scene.fans.some((fan) => fan.id === value.selectedId) &&
  validOptions(value.tighten);
const validSnapshot = (value: unknown): value is Snapshot =>
  record(value) &&
  typeof value.id === "string" &&
  value.id.length > 0 &&
  value.id.length <= 100 &&
  typeof value.name === "string" &&
  value.name.trim().length > 0 &&
  value.name.length <= 80 &&
  typeof value.createdAt === "string" &&
  Number.isFinite(Date.parse(value.createdAt)) &&
  range(value.radius, 0, 100) &&
  range(value.overlaps, 0, MAX_SHAPES * MAX_SHAPES) &&
  Number.isInteger(value.overlaps) &&
  validSettings(value.settings);
const parseSnapshots = (raw: string | null): Snapshot[] => {
  if (raw === null) {
    return [];
  }
  const data: unknown = JSON.parse(raw);
  if (
    !(
      record(data) &&
      data.version === 1 &&
      Array.isArray(data.items) &&
      data.items.length <= 500 &&
      data.items.every(validSnapshot) &&
      new Set(data.items.map((item: Snapshot) => item.id)).size === data.items.length
    )
  ) {
    throw new Error(
      "Saved snapshots have an unsupported or invalid format. Existing data was left intact.",
    );
  }
  return data.items;
};

export { parseSnapshots };

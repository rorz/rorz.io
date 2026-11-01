// biome-ignore-all lint/style/noMagicNumbers: search steps and bounds match the fan controls.
import { type Fan, type Scene, updateFan } from "./model.ts";

const MAX_SEARCH_SECONDS = 600;
const searchDuration = (seconds: number) =>
  Number.isFinite(seconds) ? Math.max(1, Math.min(MAX_SEARCH_SECONDS, seconds)) : 10;

type TightenOptions = {
  orbit: boolean;
  phase: boolean;
  tilt: boolean;
  origins: boolean;
  spread: boolean;
  seconds: number;
  seed?: number;
  threefold?: boolean;
};
type SearchField = "orbit" | "phase" | "tilt" | "spread" | "x" | "y";
type Direction = {
  fanId: string;
  field: SearchField;
  sign: number;
  contract: boolean;
};
type Variable = Pick<Direction, "fanId" | "field">;
const defaultTightenOptions = (): TightenOptions => ({
  orbit: true,
  origins: false,
  phase: true,
  seconds: 10,
  seed: 42,
  spread: false,
  tilt: true,
});
const distanceStep = 0.05;
const angleStep = 2;
const fieldsFor = (options: TightenOptions): SearchField[] => {
  const fields: SearchField[] = [];
  if (options.orbit) {
    fields.push("orbit");
  }
  if (options.phase) {
    fields.push("phase");
  }
  if (options.tilt) {
    fields.push("tilt");
  }
  if (options.spread) {
    fields.push("spread");
  }
  if (options.origins) {
    fields.push("x", "y");
  }
  return fields;
};
const searchVariables = (scene: Scene, options: TightenOptions): Variable[] => {
  const variables: Variable[] = [];
  const sharedTiltHeld = scene.linked && scene.fans.some((fan) => fan.holdTilt);
  for (const [index, fan] of scene.fans.entries()) {
    for (const field of fieldsFor(options)) {
      if (field === "tilt" && (fan.holdTilt || sharedTiltHeld || (scene.linked && index > 0))) {
        continue;
      }
      variables.push({
        fanId: fan.id,
        field,
      });
    }
  }
  return variables;
};
const searchDirections = (scene: Scene, options: TightenOptions): Direction[] => {
  const directions: Direction[] = [];
  const first = scene.fans[0];
  if (options.orbit && first) {
    // Several fans can support the same enclosing radius; shrinking only one leaves R flat.
    directions.push({
      contract: true,
      fanId: first.id,
      field: "orbit",
      sign: 0,
    });
  }
  for (const variable of searchVariables(scene, options)) {
    for (const sign of [
      -1,
      1,
    ]) {
      directions.push({
        contract: false,
        ...variable,
        sign,
      });
      // Coupled moves can cross a flat radius plateau while a fan rotates.
      if (options.orbit && variable.field !== "orbit") {
        directions.push({
          contract: true,
          ...variable,
          sign,
        });
      }
    }
  }
  return directions;
};
const constrain = (field: SearchField, value: number) => {
  if (field === "phase" || field === "tilt") {
    return ((((value + 180) % 360) + 360) % 360) - 180;
  }
  if (field === "orbit") {
    return Math.max(0, Math.min(10, value));
  }
  if (field === "spread") {
    return Math.max(0, Math.min(360, value));
  }
  return Math.max(-20, Math.min(20, value));
};
const candidateScene = (scene: Scene, direction: Direction, scale: number): Scene => {
  const fan = scene.fans.find((item) => item.id === direction.fanId);
  if (!fan) {
    return scene;
  }
  const linear = [
    "orbit",
    "x",
    "y",
  ].includes(direction.field);
  const step = (linear ? distanceStep : angleStep) * scale * direction.sign;
  const value = Number(constrain(direction.field, fan[direction.field] + step).toFixed(6));
  const patch: Partial<Fan> = {
    [direction.field]: value,
  };
  const candidate = updateFan(scene, fan.id, patch);
  if (!direction.contract) {
    return candidate;
  }
  return {
    ...candidate,
    fans: candidate.fans.map((item) => ({
      ...item,
      orbit: Number(Math.max(0, item.orbit - distanceStep * scale).toFixed(6)),
    })),
  };
};

export type { TightenOptions };
export {
  candidateScene,
  constrain,
  defaultTightenOptions,
  MAX_SEARCH_SECONDS,
  searchDirections,
  searchDuration,
  searchVariables,
};

// biome-ignore-all lint/style/noMagicNumbers: unit-circle constraints and angle conversion.
import { type Scene, updateFan } from "./model.ts";
import { constrain, searchVariables, type TightenOptions } from "./search-space.ts";

const relaxVariables = (scene: Scene, options: TightenOptions) =>
  searchVariables(scene, {
    ...options,
    origins: false,
    spread: false,
  });
type Variables = ReturnType<typeof relaxVariables>;
const parameterVector = (scene: Scene, variables: Variables) =>
  variables.map(({ fanId, field }) => {
    const fan = scene.fans.find((item) => item.id === fanId);
    const value = fan?.[field] ?? 0;
    return field === "phase" || field === "tilt" ? (value * Math.PI) / 180 : value;
  });
const parameterScene = (template: Scene, variables: Variables, vector: number[]) => {
  let scene = template;
  for (const [index, { fanId, field }] of variables.entries()) {
    const value = vector[index] ?? 0;
    const degrees = field === "phase" || field === "tilt" ? (value * 180) / Math.PI : value;
    scene = updateFan(scene, fanId, {
      [field]: constrain(field, degrees),
    });
  }
  return scene;
};

export { parameterScene, parameterVector, relaxVariables };

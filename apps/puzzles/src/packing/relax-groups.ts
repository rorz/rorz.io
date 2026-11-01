// biome-ignore-all lint/style/noMagicNumbers: rotational symmetry and degrees.
import type { Fan, Scene } from "./model.ts";

const symmetryIssue = (scene: Scene, threefold: boolean) => {
  if (!threefold) {
    return "";
  }
  if (scene.fans.some((fan) => fan.count % 3 !== 0 || fan.spread !== 360)) {
    return "Threefold symmetry needs full 360° fans with counts divisible by 3.";
  }
  const origin = scene.fans[0];
  if (scene.fans.some((fan) => fan.x !== origin?.x || fan.y !== origin?.y)) {
    return "Threefold symmetry needs all fans to share the same origin.";
  }
  return "";
};
const splitForRelax = (scene: Scene, threefold: boolean): Scene => {
  const issue = symmetryIssue(scene, threefold);
  if (issue) {
    throw new Error(issue);
  }
  let nextId = Math.max(...scene.fans.map((fan) => Number(fan.id))) + 1;
  const fans = scene.fans.flatMap((fan): Fan[] => {
    const count = threefold ? 3 : 1;
    const groups = fan.count / count;
    const divisor = fan.spread === 360 ? fan.count : Math.max(1, fan.count - 1);
    return Array.from(
      {
        length: groups,
      },
      (_, index) => {
        const id = index === 0 ? fan.id : String(nextId++);
        const phase = fan.phase + (index * fan.spread) / divisor;
        return {
          ...fan,
          count,
          id,
          phase: ((((phase + 180) % 360) + 360) % 360) - 180,
          spread: 360,
        };
      },
    );
  });
  return {
    ...scene,
    fans,
  };
};

export { splitForRelax, symmetryIssue };

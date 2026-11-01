// biome-ignore-all lint/style/noMagicNumbers: radians, unit semicircles, and parameter bounds.
import { enclosingCircle } from "./enclosure.ts";
import { generateShapes, type Placement, type Scene } from "./model.ts";
import { splitForRelax } from "./relax-groups.ts";
import { parameterScene, parameterVector, relaxVariables } from "./relax-space.ts";
import type { TightenOptions } from "./search-space.ts";

type Derivative = {
  axis: number;
  x: number;
  y: number;
  theta: number;
};
type MovingShape = Placement & {
  derivatives: Derivative[];
};
const createRelaxModel = (scene: Scene, options: TightenOptions, threefold: boolean) => {
  const template = splitForRelax(scene, threefold);
  const variables = relaxVariables(template, options);
  const circle = enclosingCircle(generateShapes(scene));
  const cartesian =
    !threefold &&
    options.orbit &&
    options.phase &&
    options.tilt &&
    !scene.linked &&
    !scene.fans.some((fan) => fan.holdTilt);
  const freeCenter = !(threefold || cartesian);
  const radiusAxis = variables.length;
  const vector = [
    ...parameterVector(template, variables),
    circle.radius,
  ];
  if (freeCenter) {
    vector.push(circle.x, circle.y);
  }
  const axes = template.fans.map((fan) => ({
    orbit: variables.findIndex(
      (variable) => variable.fanId === fan.id && variable.field === "orbit",
    ),
    phase: variables.findIndex(
      (variable) => variable.fanId === fan.id && variable.field === "phase",
    ),
    tilt: variables.findIndex(
      (variable) => variable.field === "tilt" && (template.linked || variable.fanId === fan.id),
    ),
  }));
  // Free pieces use x/y/absolute theta in the existing three parameter slots.
  // Fixing the container center removes a redundant translation; every piece
  // can translate, so this places no restriction on the attainable packings.
  if (cartesian) {
    for (const [index, fan] of template.fans.entries()) {
      const axis = axes[index];
      if (!axis) {
        continue;
      }
      const phase = (fan.phase * Math.PI) / 180;
      vector[axis.orbit] = fan.x + fan.orbit * Math.cos(phase);
      vector[axis.phase] = fan.y + fan.orbit * Math.sin(phase);
      vector[axis.tilt] = phase + (fan.tilt * Math.PI) / 180;
    }
  }
  return {
    axes,
    cartesian,
    circle,
    freeCenter,
    radiusAxis,
    template,
    threefold,
    variables,
    vector,
  };
};
type RelaxModel = ReturnType<typeof createRelaxModel>;
// Continuous geometry for derivatives. Six-decimal rounding belongs only in the
// independent candidate validator, never inside the optimization objective.
const movingShapes = (model: RelaxModel, vector: number[]): MovingShape[] =>
  model.template.fans.flatMap((fan, index) => {
    const axes = model.axes[index];
    if (model.cartesian && axes) {
      return [
        {
          derivatives: [
            {
              axis: axes.orbit,
              theta: 0,
              x: 1,
              y: 0,
            },
            {
              axis: axes.phase,
              theta: 0,
              x: 0,
              y: 1,
            },
            {
              axis: axes.tilt,
              theta: 1,
              x: 0,
              y: 0,
            },
          ],
          theta: vector[axes.tilt] ?? 0,
          x: vector[axes.orbit] ?? 0,
          y: vector[axes.phase] ?? 0,
        },
      ];
    }
    const orbit = vector[axes?.orbit ?? -1] ?? fan.orbit;
    const phase = vector[axes?.phase ?? -1] ?? (fan.phase * Math.PI) / 180;
    const tilt = vector[axes?.tilt ?? -1] ?? (fan.tilt * Math.PI) / 180;
    return Array.from(
      {
        length: fan.count,
      },
      (_, member) => {
        const angle = phase + (member * 2 * Math.PI) / fan.count;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const derivatives = [
          {
            axis: axes?.orbit ?? -1,
            theta: 0,
            x: c,
            y: s,
          },
          {
            axis: axes?.phase ?? -1,
            theta: 1,
            x: -orbit * s,
            y: orbit * c,
          },
          {
            axis: axes?.tilt ?? -1,
            theta: 1,
            x: 0,
            y: 0,
          },
        ].filter(({ axis }) => axis >= 0);
        return {
          derivatives,
          theta: angle + tilt,
          x: fan.x + orbit * c,
          y: fan.y + orbit * s,
        };
      },
    );
  });
const searchCenter = (model: RelaxModel, vector: number[]) => ({
  x: vector[model.radiusAxis + 1] ?? model.circle.x,
  y: vector[model.radiusAxis + 2] ?? model.circle.y,
});
const projectParameters = (model: RelaxModel, vector: number[]) => {
  const projected = vector.map((value, index) => {
    if (index === model.radiusAxis) {
      return Math.max(0.5, value);
    }
    return !model.cartesian && model.variables[index]?.field === "orbit"
      ? Math.max(0, Math.min(10, value))
      : value;
  });
  if (model.cartesian) {
    for (const [index, fan] of model.template.fans.entries()) {
      const axes = model.axes[index];
      if (!axes) {
        continue;
      }
      const dx = (projected[axes.orbit] ?? 0) - fan.x;
      const dy = (projected[axes.phase] ?? 0) - fan.y;
      const scale = Math.min(1, 10 / Math.hypot(dx, dy));
      projected[axes.orbit] = fan.x + dx * scale;
      projected[axes.phase] = fan.y + dy * scale;
    }
  }
  return projected;
};
const relaxScene = (model: RelaxModel, vector: number[]) => {
  const parameters = [
    ...vector,
  ];
  if (model.cartesian) {
    for (const [index, fan] of model.template.fans.entries()) {
      const axes = model.axes[index];
      if (!axes) {
        continue;
      }
      const dx = (vector[axes.orbit] ?? 0) - fan.x;
      const dy = (vector[axes.phase] ?? 0) - fan.y;
      const phase = Math.atan2(dy, dx);
      parameters[axes.orbit] = Math.hypot(dx, dy);
      parameters[axes.phase] = phase;
      parameters[axes.tilt] = (vector[axes.tilt] ?? 0) - phase;
    }
  }
  return parameterScene(model.template, model.variables, parameters);
};

export type { MovingShape, RelaxModel };
export { createRelaxModel, movingShapes, projectParameters, relaxScene, searchCenter };

// biome-ignore-all lint/style/noMagicNumbers: geometric restart families and perturbation scales.
import { movingShapes, type RelaxModel, searchCenter } from "./relax-model.ts";

const freshPacking = (model: RelaxModel, vector: number[], random: () => number) => {
  const center = searchCenter(model, vector);
  const count = model.axes.length;
  const radius = Math.max(1.5, vector[model.radiusAxis] ?? 3);
  const family = Math.floor(random() * 3);
  const wall = family === 1 && count > 5;
  const inner = Math.max(
    1,
    Math.min(count - 1, Math.round(count / 5) + Math.floor(random() * 3) - 1),
  );
  const outer = count - inner - Number(wall);
  const offset = random() * 2 * Math.PI;
  const innerTilt = Math.PI + (random() - 0.5) * 1.4;
  const outerTilt = ((random() * 2 - 1) * Math.PI) / 2;
  for (const [index, axes] of model.axes.entries()) {
    const inMiddle = index < inner;
    const atWall = wall && index === count - 1;
    const gap = Math.asin(1 / radius) + 0.15;
    let angle =
      offset +
      (inMiddle
        ? (2 * Math.PI * index) / inner
        : wall
          ? gap + ((index - inner) * (2 * Math.PI - 2 * gap)) / Math.max(1, outer - 1)
          : (2 * Math.PI * (index - inner)) / Math.max(1, outer));
    let distance = (radius - 1) * (inMiddle ? 0.55 : 1);
    let theta = angle + (inMiddle ? innerTilt : outerTilt);
    if (family === 2) {
      angle = random() * 2 * Math.PI;
      distance = (radius - 0.6) * Math.sqrt(random());
      theta = random() * 2 * Math.PI;
    } else if (atWall) {
      angle = offset;
      distance = Math.sqrt(radius * radius - 1) - 0.01;
      theta = angle + Math.PI;
    }
    vector[axes.orbit] = center.x + distance * Math.cos(angle);
    vector[axes.phase] = center.y + distance * Math.sin(angle);
    vector[axes.tilt] = theta;
  }
};

// These moves are used only when every piece has unrestricted x/y/theta.
// Locked or symmetric searches continue through the fan parameterization.
const rebuildPacking = (
  model: RelaxModel,
  source: number[],
  restart: number,
  random: () => number,
) => {
  const vector = [
    ...source,
  ];
  const shapes = movingShapes(model, vector);
  const kind = restart % 10;
  if (kind === 0) {
    freshPacking(model, vector, random);
  } else if (kind < 4) {
    const selected = shapes[Math.floor(random() * shapes.length)];
    if (!selected) {
      return vector;
    }
    const group = shapes
      .map((shape, index) => ({
        distance: Math.hypot(shape.x - selected.x, shape.y - selected.y),
        index,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, kind + 1);
    const x = group.reduce((sum, member) => sum + (shapes[member.index]?.x ?? 0), 0) / group.length;
    const y = group.reduce((sum, member) => sum + (shapes[member.index]?.y ?? 0), 0) / group.length;
    const angle = (random() * 2 - 1) * Math.PI;
    for (const { index } of group) {
      const shape = shapes[index];
      const axes = model.axes[index];
      if (!(shape && axes)) {
        continue;
      }
      const dx = shape.x - x;
      const dy = shape.y - y;
      vector[axes.orbit] = x + dx * Math.cos(angle) - dy * Math.sin(angle);
      vector[axes.phase] = y + dx * Math.sin(angle) + dy * Math.cos(angle);
      vector[axes.tilt] = shape.theta + angle + random() - 0.5;
    }
  } else if (kind === 4) {
    const axes = model.axes[Math.floor(random() * shapes.length)];
    if (axes) {
      vector[axes.tilt] = (vector[axes.tilt] ?? 0) + Math.PI;
    }
  } else {
    const amplitude =
      [
        0.1,
        0.2,
        0.4,
        0.65,
        1,
      ][kind - 5] ?? 0.2;
    for (let index = 0; index < model.radiusAxis; index += 1) {
      vector[index] = (vector[index] ?? 0) + (random() * 2 - 1) * amplitude;
    }
  }
  return vector;
};

export { rebuildPacking };

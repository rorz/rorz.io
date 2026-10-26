// biome-ignore-all lint/style/noMagicNumbers: geometric exploration families and move scales.
import { movingShapes, type RelaxModel, searchCenter } from "./relax-model.ts";

const seedPairs = (model: RelaxModel, vector: number[], random: () => number) => {
  const center = searchCenter(model, vector);
  const pairs = Math.floor(model.axes.length / 2);
  const radius = Math.max(1, (vector[model.radiusAxis] ?? 3) - 1);
  for (let i = 0; i < pairs; i += 1) {
    const angle = (2 * Math.PI * i) / Math.max(1, pairs - 1);
    const distance = i === pairs - 1 ? 0 : radius;
    const theta = random() * 2 * Math.PI;
    for (let half = 0; half < 2; half += 1) {
      const axes = model.axes[2 * i + half];
      if (axes) {
        vector[axes.orbit] = center.x + distance * Math.cos(angle);
        vector[axes.phase] = center.y + distance * Math.sin(angle);
        vector[axes.tilt] = theta + half * Math.PI;
      }
    }
  }
  const last = model.axes.at(-1);
  if (last && model.axes.length % 2) {
    const angle = random() * 2 * Math.PI;
    vector[last.orbit] = center.x + (radius + 0.4) * Math.cos(angle);
    vector[last.phase] = center.y + (radius + 0.4) * Math.sin(angle);
    vector[last.tilt] = angle + Math.PI + random() - 0.5;
  }
};

const moveGroup = (model: RelaxModel, vector: number[], kind: number, random: () => number) => {
  const shapes = movingShapes(model, vector);
  const selected = shapes[Math.floor(random() * shapes.length)];
  if (!selected) {
    return;
  }
  const group = shapes
    .map((shape, index) => ({
      distance: Math.hypot(shape.x - selected.x, shape.y - selected.y),
      index,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2 + Math.floor(random() * 5));
  const x = group.reduce((sum, item) => sum + (shapes[item.index]?.x ?? 0), 0) / group.length;
  const y = group.reduce((sum, item) => sum + (shapes[item.index]?.y ?? 0), 0) / group.length;
  const angle = (random() * 2 - 1) * Math.PI;
  for (const { index } of group) {
    const shape = shapes[index];
    const axes = model.axes[index];
    if (!(shape && axes)) {
      continue;
    }
    const dx = shape.x - x;
    const dy = shape.y - y;
    if (kind === 2) {
      vector[axes.orbit] = x + (random() * 2 - 1) * 1.3;
      vector[axes.phase] = y + (random() * 2 - 1) * 1.3;
      vector[axes.tilt] = random() * 2 * Math.PI;
    } else if (kind % 2) {
      vector[axes.orbit] = x + dx * Math.cos(angle) - dy * Math.sin(angle);
      vector[axes.phase] = y + dx * Math.sin(angle) + dy * Math.cos(angle);
      vector[axes.tilt] = shape.theta + angle;
    } else {
      vector[axes.orbit] = x + dx * Math.cos(2 * angle) + dy * Math.sin(2 * angle);
      vector[axes.phase] = y + dx * Math.sin(2 * angle) - dy * Math.cos(2 * angle);
      vector[axes.tilt] = 2 * angle - shape.theta;
    }
  }
};

// Only unrestricted Cartesian searches enter here. Group reflections, rebuilding,
// relocation and fresh paired seeds change contacts beyond small local nudges.
const explorePacking = (model: RelaxModel, source: number[], random: () => number) => {
  const vector = [
    ...source,
  ];
  const kind = Math.floor(random() * 13);
  const center = searchCenter(model, vector);
  if (kind === 0) {
    const extent = Math.max(1, (source[model.radiusAxis] ?? 3) - 0.5);
    for (const axes of model.axes) {
      const angle = random() * 2 * Math.PI;
      const radius = extent * Math.sqrt(random());
      vector[axes.orbit] = center.x + radius * Math.cos(angle);
      vector[axes.phase] = center.y + radius * Math.sin(angle);
      vector[axes.tilt] = random() * 2 * Math.PI;
    }
  } else if (kind === 1) {
    seedPairs(model, vector, random);
  } else if (kind < 6) {
    moveGroup(model, vector, kind, random);
  } else if (kind < 8) {
    const axes = model.axes[Math.floor(random() * model.axes.length)];
    if (axes && kind === 6) {
      vector[axes.tilt] = (vector[axes.tilt] ?? 0) + Math.PI;
    } else if (axes) {
      const angle = random() * 2 * Math.PI;
      const radius = Math.max(1, (source[model.radiusAxis] ?? 3) - 1);
      vector[axes.orbit] = center.x + radius * Math.cos(angle);
      vector[axes.phase] = center.y + radius * Math.sin(angle);
      vector[axes.tilt] = angle + (random() - 0.5) * Math.PI;
    }
  } else {
    const amplitude =
      [
        0.08,
        0.2,
        0.4,
        0.7,
        1.1,
      ][kind - 8] ?? 0.3;
    for (let index = 0; index < model.radiusAxis; index += 1) {
      vector[index] = (vector[index] ?? 0) + (random() * 2 - 1) * amplitude;
    }
  }
  return vector;
};

export { explorePacking };

// biome-ignore-all lint/style/noMagicNumbers: strict clearance margin and augmented-Lagrangian arithmetic.
import { pairClearance } from "./clearance.ts";
import { farthestPoint } from "./enclosure.ts";
import { type MovingShape, movingShapes, type RelaxModel, searchCenter } from "./relax-model.ts";

type Penalty = {
  weight: number;
  multipliers: number[];
};
const addShapeGradient = (
  gradient: number[],
  shape: MovingShape,
  force: {
    x: number;
    y: number;
    theta: number;
  },
) => {
  for (const derivative of shape.derivatives) {
    gradient[derivative.axis] =
      (gradient[derivative.axis] ?? 0) +
      force.x * derivative.x +
      force.y * derivative.y +
      force.theta * derivative.theta;
  }
};
// Powell-Hestenes-Rockafellar inequality AL: g >= 0,
// L = R + sum((max(0, lambda - rho*g)^2 - lambda^2)/(2*rho)).
const packingEnergy = (model: RelaxModel, vector: number[], penalty: Penalty) => {
  const shapes = movingShapes(model, vector);
  const center = searchCenter(model, vector);
  const radius = vector[model.radiusAxis] ?? 0;
  const gradient = vector.map(() => 0);
  gradient[model.radiusAxis] = 1;
  const gaps: number[] = [];
  let value = radius;
  let pairViolation = 0;
  const coefficient = (gap: number) => {
    const lambda = penalty.multipliers[gaps.length] ?? 0;
    const active = Math.max(0, lambda - penalty.weight * gap);
    gaps.push(gap);
    value += (active * active - lambda * lambda) / (2 * penalty.weight);
    return -active;
  };
  for (const [index, a] of shapes.entries()) {
    for (const b of shapes.slice(index + 1)) {
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const lambda = penalty.multipliers[gaps.length] ?? 0;
      if (distance > 2.1 && lambda === 0) {
        coefficient(distance - 2);
        continue;
      }
      const contact = pairClearance(a, b);
      const weight = coefficient(contact.gap - 3e-6);
      pairViolation = Math.max(pairViolation, -contact.gap);
      if (weight === 0) {
        continue;
      }
      const nx = Math.cos(contact.angle);
      const ny = Math.sin(contact.angle);
      const torqueA = (contact.first.x - a.x) * ny - (contact.first.y - a.y) * nx;
      const torqueB = (contact.second.x - b.x) * ny - (contact.second.y - b.y) * nx;
      addShapeGradient(gradient, a, {
        theta: -weight * torqueA,
        x: -weight * nx,
        y: -weight * ny,
      });
      addShapeGradient(gradient, b, {
        theta: weight * torqueB,
        x: weight * nx,
        y: weight * ny,
      });
    }
  }
  for (const shape of shapes) {
    const point = farthestPoint(shape, center);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const distance = Math.hypot(dx, dy);
    const weight = coefficient(radius - distance);
    const nx = dx / distance;
    const ny = dy / distance;
    const torque = (point.x - shape.x) * ny - (point.y - shape.y) * nx;
    addShapeGradient(gradient, shape, {
      theta: -weight * torque,
      x: -weight * nx,
      y: -weight * ny,
    });
    gradient[model.radiusAxis] = (gradient[model.radiusAxis] ?? 0) + weight;
    if (model.freeCenter) {
      gradient[model.radiusAxis + 1] = (gradient[model.radiusAxis + 1] ?? 0) + weight * nx;
      gradient[model.radiusAxis + 2] = (gradient[model.radiusAxis + 2] ?? 0) + weight * ny;
    }
  }
  return {
    gaps,
    gradient,
    pairViolation,
    value,
    violation: Math.max(0, ...gaps.map((gap) => -gap)),
  };
};

export { packingEnergy };

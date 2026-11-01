// biome-ignore-all lint/style/noMagicNumbers: unit semicircle geometry and conservative numerical margins.
import { enclosingCircle, enclosingPoints, farthestPoint } from "./enclosure.ts";
import type { Circle, Placement, Point } from "./model.ts";

type RadiusWitness = {
  index: number;
  point: Point;
  source: Placement;
};

// These points remain a lower-bound certificate even when an interior piece moves.
// Snapshot source poses so mutating a walker cannot mutate its certificate.
const createRadiusWitnesses = (
  shapes: Placement[],
  circle: Circle = enclosingCircle(shapes),
): RadiusWitness[] =>
  shapes.flatMap((shape, index) => {
    if (
      ![
        shape.x,
        shape.y,
        shape.theta,
      ].every(Number.isFinite)
    ) {
      throw new Error("Radius witnesses require finite placements.");
    }
    const diameter = shape.theta + Math.PI / 2;
    return [
      {
        x: shape.x + Math.cos(diameter),
        y: shape.y + Math.sin(diameter),
      },
      {
        x: shape.x - Math.cos(diameter),
        y: shape.y - Math.sin(diameter),
      },
      farthestPoint(shape, circle),
    ].map((point) => ({
      index,
      point,
      source: {
        ...shape,
      },
    }));
  });

// A moved centre makes this particular witness inconclusive. For an unchanged
// centre, an angle change only removes the point when it leaves the curved half.
// Subtract the enclosure solver's resolution; never reject a small gain on an
// optimistic floating-point lower bound. Returning a low bound is inconclusive,
// not evidence that a candidate actually reduces the enclosing radius.
const retainedRadiusBound = (witnesses: RadiusWitness[], shapes: Placement[]): number => {
  const retained = witnesses.filter(({ index, point, source }) => {
    const shape = shapes[index];
    if (!shape || shape.x !== source.x || shape.y !== source.y) {
      return false;
    }
    if (shape.theta === source.theta) {
      return true;
    }
    const normal =
      (point.x - shape.x) * Math.cos(shape.theta) + (point.y - shape.y) * Math.sin(shape.theta);
    return normal > 1e-12;
  });
  return Math.max(0, enclosingPoints(retained.map(({ point }) => point)).radius - 1e-10);
};

export { createRadiusWitnesses, retainedRadiusBound };

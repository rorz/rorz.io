// biome-ignore-all lint/style/noMagicNumbers: circle formulas, refinement limits, and precision bounds.
import { type Circle, type Placement, type Point, TAU } from "./model.ts";

type Disk = Point & {
  radius: number;
};
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const throughPair = (a: Point, b: Point): Disk => ({
  radius: distance(a, b) / 2,
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});
const throughTriple = (a: Point, b: Point, c: Point): Disk => {
  const bx = b.x - a.x;
  const by = b.y - a.y;
  const cx = c.x - a.x;
  const cy = c.y - a.y;
  const determinant = 2 * (bx * cy - by * cx);
  if (Math.abs(determinant) < 1e-14) {
    return [
      throughPair(a, b),
      throughPair(a, c),
      throughPair(b, c),
    ].reduce((largest, next) => (largest.radius > next.radius ? largest : next));
  }
  const bLength = bx * bx + by * by;
  const cLength = cx * cx + cy * cy;
  const x = (bLength * cy - cLength * by) / determinant;
  const y = (cLength * bx - bLength * cx) / determinant;
  return {
    radius: Math.hypot(x, y),
    x: x + a.x,
    y: y + a.y,
  };
};
const contains = (circle: Disk, point: Point) => distance(circle, point) <= circle.radius + 1e-12;

// Deterministic shuffle keeps the incremental enclosing-circle solve responsive.
const shuffled = (points: Point[]) => {
  const result = [
    ...points,
  ];
  let seed = 42;
  for (let index = result.length - 1; index > 0; index--) {
    seed = (seed * 16_807) % 2_147_483_647;
    const swap = seed % (index + 1);
    const a = result[index];
    const b = result[swap];
    if (a && b) {
      result[index] = b;
      result[swap] = a;
    }
  }
  return result;
};
const pointCircle = (points: Point[]): Disk => {
  const ordered = shuffled(points);
  let circle: Disk = {
    radius: 0,
    x: 0,
    y: 0,
  };
  for (const [i, a] of ordered.entries()) {
    if (contains(circle, a)) {
      continue;
    }
    circle = {
      ...a,
      radius: 0,
    };
    for (const [j, b] of ordered.slice(0, i).entries()) {
      if (contains(circle, b)) {
        continue;
      }
      circle = throughPair(a, b);
      for (const c of ordered.slice(0, j)) {
        if (!contains(circle, c)) {
          circle = throughTriple(a, b, c);
        }
      }
    }
  }
  return circle;
};

const boundaryPoint = (shape: Placement, angle: number): Point => ({
  x: shape.x + Math.cos(angle),
  y: shape.y + Math.sin(angle),
});
const farthestPoint = (shape: Placement, query: Point): Point => {
  const direction = Math.atan2(shape.y - query.y, shape.x - query.x);
  const candidates = [
    boundaryPoint(shape, shape.theta - Math.PI / 2),
    boundaryPoint(shape, shape.theta + Math.PI / 2),
  ];
  if (Math.cos(direction - shape.theta) >= 0) {
    candidates.push(boundaryPoint(shape, direction));
  }
  return candidates.reduce((best, point) =>
    distance(best, query) > distance(point, query) ? best : point,
  );
};

// Exchange constraints until the analytic farthest points agree with the point MEC.
// The returned radius always encloses the arcs; error bounds its excess over the minimum.
const enclosingCircle = (shapes: Placement[]): Circle => {
  const points = shapes.flatMap((shape) =>
    Array.from(
      {
        length: 9,
      },
      (_, index) => boundaryPoint(shape, shape.theta - TAU / 4 + (index * Math.PI) / 8),
    ),
  );
  let circle = pointCircle(points);
  let radius = circle.radius;
  for (let iteration = 0; iteration < 32; iteration++) {
    const current = circle;
    const farthest = shapes.map((shape) => farthestPoint(shape, current));
    radius = Math.max(current.radius, ...farthest.map((point) => distance(current, point)));
    if (radius - circle.radius < 1e-10) {
      break;
    }
    points.push(...farthest);
    if (iteration < 31) {
      circle = pointCircle(points);
    }
  }
  return {
    ...circle,
    error: Math.max(0, radius - circle.radius),
    radius,
  };
};

export { enclosingCircle, farthestPoint };

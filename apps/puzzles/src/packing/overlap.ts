// biome-ignore-all lint/style/noMagicNumbers: analytic unit-circle integration and numerical tolerances.
import { type Collision, OVERLAP_TOLERANCE, type Placement, type Shape, TAU } from "./model.ts";
import { POLYGON_AREA_DEFICIT, polygonIntersectionArea } from "./polygon-overlap.ts";

type Plane = {
  nx: number;
  ny: number;
  x: number;
  y: number;
};
const EPSILON = 1e-12;
const normal = (shape: Placement): Plane => ({
  nx: Math.cos(shape.theta),
  ny: Math.sin(shape.theta),
  x: shape.x,
  y: shape.y,
});
const wrap = (angle: number) => ((angle % TAU) + TAU) % TAU;

// Integrate only the circle arcs inside every disk/half-plane constraint.
const arcIntegral = (circle: Placement, other: Placement, planes: Plane[]) => {
  const constraints = planes.map((plane) => ({
    angle: Math.atan2(plane.ny, plane.nx),
    threshold: (plane.x - circle.x) * plane.nx + (plane.y - circle.y) * plane.ny,
  }));
  const dx = other.x - circle.x;
  const dy = other.y - circle.y;
  const distance = Math.hypot(dx, dy);
  if (distance > EPSILON) {
    constraints.push({
      angle: Math.atan2(dy, dx),
      threshold: distance / 2,
    });
  }
  if (constraints.some(({ threshold }) => threshold >= 1)) {
    return 0;
  }
  const cuts = [
    0,
    TAU,
  ];
  for (const { angle, threshold } of constraints) {
    if (threshold > -1) {
      const delta = Math.acos(threshold);
      cuts.push(wrap(angle - delta), wrap(angle + delta));
    }
  }
  cuts.sort((a, b) => a - b);
  let integral = 0;
  for (let index = 1; index < cuts.length; index++) {
    const start = cuts[index - 1] ?? 0;
    const end = cuts[index] ?? 0;
    const midpoint = (start + end) / 2;
    if (constraints.every(({ angle, threshold }) => Math.cos(midpoint - angle) >= threshold)) {
      integral +=
        end -
        start +
        circle.x * (Math.sin(end) - Math.sin(start)) -
        circle.y * (Math.cos(end) - Math.cos(start));
    }
  }
  return integral / 2;
};

// Orient each diameter so its interior lies to the left, then clip the line.
const lineIntegral = (plane: Plane, other: Plane, circles: Placement[]) => {
  const tx = plane.ny;
  const ty = -plane.nx;
  let low = -1;
  let high = 1;
  for (const circle of circles) {
    const dx = circle.x - plane.x;
    const dy = circle.y - plane.y;
    const along = dx * tx + dy * ty;
    const perpendicular = dx * plane.nx + dy * plane.ny;
    if (Math.abs(perpendicular) >= 1) {
      return 0;
    }
    const extent = Math.sqrt(Math.max(0, 1 - perpendicular * perpendicular));
    low = Math.max(low, along - extent);
    high = Math.min(high, along + extent);
  }
  const slope = tx * other.nx + ty * other.ny;
  const offset = (plane.x - other.x) * other.nx + (plane.y - other.y) * other.ny;
  if (Math.abs(slope) < EPSILON) {
    if (offset < -EPSILON) {
      return 0;
    }
  } else if (slope > 0) {
    low = Math.max(low, -offset / slope);
  } else {
    high = Math.min(high, -offset / slope);
  }
  return high > low ? ((high - low) * (plane.x * ty - plane.y * tx)) / 2 : 0;
};

// Green's theorem on the intersection boundary: circular arcs plus diameters.
// Translation to the first center avoids cancellation for distant arrangements.
const intersectionArea = (first: Placement, second: Placement): number => {
  const a = {
    theta: first.theta,
    x: 0,
    y: 0,
  };
  const b = {
    theta: second.theta,
    x: second.x - first.x,
    y: second.y - first.y,
  };
  const distance = Math.hypot(b.x, b.y);
  if (distance >= 2) {
    return 0;
  }
  const pa = normal(a);
  const pb = normal(b);
  const planes = [
    pa,
    pb,
  ];
  let area = arcIntegral(a, b, planes);
  if (distance > EPSILON) {
    area += arcIntegral(b, a, planes);
  }
  area += lineIntegral(pa, pb, [
    a,
    b,
  ]);
  const samePlane =
    Math.abs(pa.nx - pb.nx) < EPSILON &&
    Math.abs(pa.ny - pb.ny) < EPSILON &&
    Math.abs(b.x * pa.nx + b.y * pa.ny) < EPSILON;
  if (!samePlane) {
    area += lineIntegral(pb, pa, [
      a,
      b,
    ]);
  }
  return Math.max(0, Math.min(Math.PI / 2, area));
};

const findCollisions = (shapes: Shape[]): Collision[] => {
  const collisions: Collision[] = [];
  for (const [index, shape] of shapes.entries()) {
    for (const other of shapes.slice(index + 1)) {
      let area = intersectionArea(shape, other);
      if (area > OVERLAP_TOLERANCE && area <= OVERLAP_TOLERANCE + POLYGON_AREA_DEFICIT) {
        area = polygonIntersectionArea(shape, other);
      }
      if (area > OVERLAP_TOLERANCE) {
        collisions.push({
          a: shape.id,
          area,
          b: other.id,
        });
      }
    }
  }
  return collisions;
};

export { findCollisions, intersectionArea };

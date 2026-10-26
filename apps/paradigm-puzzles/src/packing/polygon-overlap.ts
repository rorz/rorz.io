// biome-ignore-all lint/style/noMagicNumbers: the published validator uses 4096 arc vertices per unit semicircle.
import type { Placement, Point } from "./model.ts";

const ARC_POINTS = 4096;
const ANGLE_STEP = Math.PI / (ARC_POINTS - 1);
const EDGE_DISTANCE = Math.cos(ANGLE_STEP / 2);
const UNIT_ARC = Array.from(
  {
    length: ARC_POINTS,
  },
  (_, index) => ({
    x: Math.cos(-Math.PI / 2 + index * ANGLE_STEP),
    y: Math.sin(-Math.PI / 2 + index * ANGLE_STEP),
  }),
);

// The intersection can lose at most the sum of both inscribed polygon deficits.
const POLYGON_AREA_DEFICIT = Math.PI - (ARC_POINTS - 1) * Math.sin(ANGLE_STEP);
const EDGE_NORMALS = Array.from(
  {
    length: ARC_POINTS - 1,
  },
  (_, index) => ({
    x: Math.cos(-Math.PI / 2 + (index + 0.5) * ANGLE_STEP),
    y: Math.sin(-Math.PI / 2 + (index + 0.5) * ANGLE_STEP),
  }),
);
const bounds = (points: Point[]) => ({
  maxX: Math.max(...points.map((point) => point.x)),
  maxY: Math.max(...points.map((point) => point.y)),
  minX: Math.min(...points.map((point) => point.x)),
  minY: Math.min(...points.map((point) => point.y)),
});

const clip = (points: Point[], nx: number, ny: number, offset: number): Point[] => {
  const result: Point[] = [];
  let previous = points.at(-1);
  if (!previous) {
    return result;
  }
  let previousDistance = previous.x * nx + previous.y * ny - offset;
  for (const point of points) {
    const distance = point.x * nx + point.y * ny - offset;
    if (distance < 0 !== previousDistance < 0) {
      const fraction = previousDistance / (previousDistance - distance);
      result.push({
        x: previous.x + fraction * (point.x - previous.x),
        y: previous.y + fraction * (point.y - previous.y),
      });
    }
    if (distance <= 0) {
      result.push(point);
    }
    previous = point;
    previousDistance = distance;
  }
  return result;
};

const polygonIntersectionArea = (a: Placement, b: Placement): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  if (Math.hypot(dx, dy) >= 2) {
    return 0;
  }
  const cosine = Math.cos(a.theta);
  const sine = Math.sin(a.theta);
  const otherCosine = Math.cos(b.theta);
  const otherSine = Math.sin(b.theta);
  // Work around b's center to avoid cancellation under large translations.
  let points = UNIT_ARC.map((point) => ({
    x: dx + point.x * cosine - point.y * sine,
    y: dy + point.x * sine + point.y * cosine,
  }));
  points = clip(points, -otherCosine, -otherSine, 0);
  const direction = Math.atan2(dy, dx) - b.theta;
  const nearest = Math.max(
    0,
    Math.min(
      ARC_POINTS - 2,
      Math.floor((Math.atan2(Math.sin(direction), Math.cos(direction)) + Math.PI / 2) / ANGLE_STEP),
    ),
  );
  // Clip the facing edge first: near contact, only a few vertices survive.
  const firstAngle = b.theta - Math.PI / 2 + (nearest + 0.5) * ANGLE_STEP;
  points = clip(points, Math.cos(firstAngle), Math.sin(firstAngle), EDGE_DISTANCE);
  let box = bounds(points);
  for (let index = 0; index < ARC_POINTS - 1 && points.length >= 3; index += 1) {
    const normal = EDGE_NORMALS[index];
    if (!normal) {
      continue;
    }
    const nx = normal.x * otherCosine - normal.y * otherSine;
    const ny = normal.x * otherSine + normal.y * otherCosine;
    const maximum = nx * (nx >= 0 ? box.maxX : box.minX) + ny * (ny >= 0 ? box.maxY : box.minY);
    if (maximum > EDGE_DISTANCE) {
      points = clip(points, nx, ny, EDGE_DISTANCE);
      box = bounds(points);
    }
  }
  const origin = points[0];
  let area = 0;
  if (origin) {
    for (let index = 1; index < points.length - 1; index += 1) {
      const first = points[index];
      const second = points[index + 1];
      if (first && second) {
        area +=
          (first.x - origin.x) * (second.y - origin.y) -
          (first.y - origin.y) * (second.x - origin.x);
      }
    }
  }
  return Math.abs(area) / 2;
};

export { POLYGON_AREA_DEFICIT, polygonIntersectionArea };

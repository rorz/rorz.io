// biome-ignore-all lint/style/noMagicNumbers: analytic support intervals and geometric tolerances.
import type { Placement, Point, Shape } from "./model.ts";

type Contact = {
  a: string;
  b: string;
  gap: number;
  first: Point;
  second: Point;
};
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
// Between flat-face normals the support difference is v·n - c. Every smooth
// maximum points between two arc centers/endpoints; cusps occur at a flat face.
// These eleven directions cover both separated and penetrating semicircles.
// Work with unit vectors to avoid sorting angular intervals and evaluating trig
// at every interval boundary in the optimizer's innermost loop.
// Positive = distance; negative = minimum translation needed to separate the interiors.
const separatingAxis = (a: Placement, b: Placement) => {
  const ax = Math.cos(a.theta);
  const ay = Math.sin(a.theta);
  const bx = Math.cos(b.theta);
  const by = Math.sin(b.theta);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let gap = Number.NEGATIVE_INFINITY;
  let nx = 1;
  let ny = 0;
  const test = (x: number, y: number) => {
    const length = Math.hypot(x, y);
    if (length < 1e-15) {
      return;
    }
    const ux = x / length;
    const uy = y / length;
    const first = ux * ax + uy * ay >= 0 ? 1 : Math.abs(-ux * ay + uy * ax);
    const second = ux * bx + uy * by <= 0 ? 1 : Math.abs(-ux * by + uy * bx);
    const value = dx * ux + dy * uy - first - second;
    if (value > gap) {
      gap = value;
      nx = ux;
      ny = uy;
    }
  };
  test(-ax, -ay);
  test(bx, by);
  test(dx, dy);
  for (const first of [
    -1,
    1,
  ]) {
    test(dx + first * ay, dy - first * ax);
    test(dx - first * by, dy + first * bx);
    for (const second of [
      -1,
      1,
    ]) {
      test(dx + first * ay - second * by, dy - first * ax + second * bx);
    }
  }
  return {
    angle: Math.atan2(ny, nx),
    gap,
  };
};
const supportEdge = (
  shape: Placement,
  angle: number,
): [
  Point,
  Point,
] => {
  if (Math.cos(angle - shape.theta) >= 0) {
    const point = {
      x: shape.x + Math.cos(angle),
      y: shape.y + Math.sin(angle),
    };
    return [
      point,
      point,
    ];
  }
  const tangent = {
    x: -Math.sin(shape.theta),
    y: Math.cos(shape.theta),
  };
  const first = {
    x: shape.x + tangent.x,
    y: shape.y + tangent.y,
  };
  const second = {
    x: shape.x - tangent.x,
    y: shape.y - tangent.y,
  };
  if (Math.abs(Math.sin(angle - shape.theta)) < 1e-10) {
    return [
      first,
      second,
    ];
  }
  const point = Math.sin(angle - shape.theta) > 0 ? first : second;
  return [
    point,
    point,
  ];
};
const edgePoint = (
  edge: [
    Point,
    Point,
  ],
  tangent: Point,
  position: number,
) => {
  const [a, b] = edge;
  const span = dot(b, tangent) - dot(a, tangent);
  const ratio =
    Math.abs(span) < 1e-12 ? 0 : Math.max(0, Math.min(1, (position - dot(a, tangent)) / span));
  return {
    x: a.x + ratio * (b.x - a.x),
    y: a.y + ratio * (b.y - a.y),
  };
};
const pairClearance = (a: Placement, b: Placement) => {
  const { gap, angle } = separatingAxis(a, b);
  const tangent = {
    x: -Math.sin(angle),
    y: Math.cos(angle),
  };
  const first = supportEdge(a, angle);
  const second = supportEdge(b, angle + Math.PI);
  const firstRange = first.map((point) => dot(point, tangent));
  const secondRange = second.map((point) => dot(point, tangent));
  const low = Math.max(Math.min(...firstRange), Math.min(...secondRange));
  const high = Math.min(Math.max(...firstRange), Math.max(...secondRange));
  const position = (low + high) / 2;
  return {
    angle,
    first: edgePoint(first, tangent, position),
    gap,
    second: edgePoint(second, tangent, position),
  };
};
const nearbyContacts = (shapes: Shape[], threshold = 0.02): Contact[] => {
  const contacts: Contact[] = [];
  for (const [index, a] of shapes.entries()) {
    for (const b of shapes.slice(index + 1)) {
      if (Math.hypot(b.x - a.x, b.y - a.y) > 2 + threshold) {
        continue;
      }
      const pair = pairClearance(a, b);
      if (pair.gap <= threshold) {
        contacts.push({
          a: a.id,
          b: b.id,
          ...pair,
        });
      }
    }
  }
  return contacts.sort((a, b) => a.gap - b.gap);
};

export type { Contact };
export { nearbyContacts, pairClearance, separatingAxis };

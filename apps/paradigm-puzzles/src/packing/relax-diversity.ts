// biome-ignore-all lint/style/noMagicNumbers: unit-semicircle centroid and geometric deduplication tolerance.
import type { Placement } from "./model.ts";

// Distances between area centroids ignore labels, whole-packing rotation, and
// translation. Contact edge IDs alone mistake relabelled copies for new basins.
const packingFingerprint = (shapes: Placement[]) => {
  const centroids = shapes.map((shape) => ({
    x: shape.x + (4 / (3 * Math.PI)) * Math.cos(shape.theta),
    y: shape.y + (4 / (3 * Math.PI)) * Math.sin(shape.theta),
  }));
  const distances: number[] = [];
  for (const [i, a] of centroids.entries()) {
    for (const b of centroids.slice(i + 1)) {
      distances.push(Math.hypot(a.x - b.x, a.y - b.y));
    }
  }
  return distances.sort((a, b) => a - b);
};

const samePacking = (first: number[] | undefined, second: number[] | undefined) =>
  Boolean(
    first &&
      second &&
      first.length === second.length &&
      first.every((distance, index) => Math.abs(distance - (second[index] ?? 0)) < 0.004),
  );

export { packingFingerprint, samePacking };

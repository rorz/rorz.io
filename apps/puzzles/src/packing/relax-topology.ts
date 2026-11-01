// biome-ignore-all lint/style/noMagicNumbers: contact thresholds and graph refinement depth.
import { separatingAxis } from "./clearance.ts";
import { farthestPoint } from "./enclosure.ts";
import type { Circle, Placement } from "./model.ts";

const compareLabels = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

// A label-invariant contact-graph heuristic for search diversity, never a
// feasibility test. Slightly unsettled copies of one basin can have noticeably
// different coordinates while retaining exactly the same contact network.
const packingTopology = (shapes: Placement[], circle: Pick<Circle, "x" | "y" | "radius">) => {
  const neighbours = shapes.map(() => [] as number[]);
  for (const [i, a] of shapes.entries()) {
    for (let j = i + 1; j < shapes.length; j += 1) {
      const b = shapes[j];
      if (b && Math.hypot(a.x - b.x, a.y - b.y) < 2.01 && separatingAxis(a, b).gap < 0.002) {
        neighbours[i]?.push(j);
        neighbours[j]?.push(i);
      }
    }
  }
  let colours = shapes.map((shape, i) => {
    const point = farthestPoint(shape, circle);
    const boundary = Math.hypot(point.x - circle.x, point.y - circle.y) > circle.radius - 0.002;
    return `${Number(boundary)}:${neighbours[i]?.length ?? 0}`;
  });
  const rounds: string[] = [];
  for (let round = 0; round < 3; round += 1) {
    rounds.push(
      [
        ...colours,
      ]
        .sort(compareLabels)
        .join(";"),
    );
    const palette = [
      ...new Set(colours),
    ].sort(compareLabels);
    const labels = colours.map((colour) => palette.indexOf(colour));
    colours = neighbours.map(
      (indices, i) =>
        `${labels[i]}:${indices
          .map((index) => labels[index])
          .sort((a, b) => (a ?? 0) - (b ?? 0))
          .join(",")}`,
    );
  }
  rounds.push(colours.sort(compareLabels).join(";"));
  return rounds.join("|");
};

export { packingTopology };

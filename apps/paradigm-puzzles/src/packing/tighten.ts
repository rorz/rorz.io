// biome-ignore-all lint/style/noMagicNumbers: improvement tolerances and bounded search resolution.
import { enclosingCircle } from "./enclosure.ts";
import { generateShapes, OVERLAP_TOLERANCE, type Scene } from "./model.ts";
import { findCollisions } from "./overlap.ts";
import { candidateScene, searchDirections, type TightenOptions } from "./search-space.ts";

type Evaluation = {
  scene: Scene;
  radius: number;
  overlaps: number;
  violation: number;
};
type SearchProgress = {
  best: Evaluation;
  evaluations: number;
  scale: number;
  finished: boolean;
};
type Search = SearchProgress & {
  base: Evaluation;
  cursor: number;
  directions: ReturnType<typeof searchDirections>;
};
type SearchRequest = {
  scene: Scene;
  options: TightenOptions;
};
type SearchUpdate = SearchProgress & {
  initial: Pick<Evaluation, "radius" | "overlaps">;
  elapsed: number;
  reason: string;
  restarts: number;
  seed: number;
};
const evaluateScene = (scene: Scene): Evaluation => {
  const shapes = generateShapes(scene);
  const collisions = findCollisions(shapes);
  return {
    overlaps: collisions.length,
    radius: enclosingCircle(shapes).radius,
    scene,
    violation: collisions.reduce((sum, collision) => sum + collision.area - OVERLAP_TOLERANCE, 0),
  };
};
// Feasibility comes first. A feasible incumbent can never be replaced by an overlap.
const improves = (candidate: Evaluation, incumbent: Evaluation) => {
  if (incumbent.overlaps === 0) {
    return candidate.overlaps === 0 && candidate.radius < incumbent.radius - 1e-8;
  }
  if (candidate.overlaps === 0) {
    return true;
  }
  if (candidate.violation < incumbent.violation - 1e-12) {
    return true;
  }
  return (
    Math.abs(candidate.violation - incumbent.violation) <= 1e-12 &&
    candidate.radius < incumbent.radius - 1e-8
  );
};
const createSearch = (scene: Scene, options: TightenOptions): Search => {
  const initial = evaluateScene(structuredClone(scene));
  return {
    base: initial,
    best: initial,
    cursor: 0,
    directions: searchDirections(scene, options),
    evaluations: 1,
    finished: false,
    scale: 1,
  };
};
const advanceSearch = (search: Search): SearchProgress => {
  const direction = search.directions[search.cursor];
  if (!direction || search.scale < 1 / 8192) {
    search.finished = true;
    return search;
  }
  const candidate = evaluateScene(candidateScene(search.base.scene, direction, search.scale));
  search.evaluations += 1;
  if (improves(candidate, search.best)) {
    search.best = candidate;
  }
  search.cursor += 1;
  if (search.cursor === search.directions.length) {
    if (!improves(search.best, search.base)) {
      search.scale /= 2;
    }
    search.base = search.best;
    search.cursor = 0;
  }
  return search;
};

export type { SearchRequest, SearchUpdate };
export { advanceSearch, createSearch, evaluateScene, improves };

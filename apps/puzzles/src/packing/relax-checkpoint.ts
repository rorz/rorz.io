import type { Scene } from "./model.ts";
import type { RelaxSearch } from "./relax.ts";
import { randomSource } from "./relax-hopping.ts";
import { createLocalRelax } from "./relax-local.ts";
import type { TightenOptions } from "./search-space.ts";

const searchKey = (options: TightenOptions) =>
  JSON.stringify([
    options.orbit,
    options.phase,
    options.tilt,
    options.threefold ?? true,
    options.seed ?? 42,
  ]);

// A worker can be terminated immediately without losing its explored basins,
// random sequence, or current minimizer. Only plain data crosses the boundary.
const checkpointRelax = (search: RelaxSearch, options: TightenOptions) => {
  const { objective: _objective, project: _project, ...local } = search.local;
  return {
    ...search,
    key: searchKey(options),
    local,
    random: search.random.state(),
  };
};
type RelaxCheckpoint = ReturnType<typeof checkpointRelax>;

const canResumeRelax = (
  checkpoint: RelaxCheckpoint | undefined,
  scene: Scene,
  options: TightenOptions,
) =>
  Boolean(
    checkpoint &&
      checkpoint.key === searchKey(options) &&
      JSON.stringify(checkpoint.best.scene) === JSON.stringify(scene),
  );

const restoreRelax = (checkpoint: RelaxCheckpoint): RelaxSearch => {
  const saved = structuredClone(checkpoint);
  const local = createLocalRelax(
    saved.model,
    saved.local.minimizer.vector,
    saved.local.control.target,
  );
  // The objective closes over these objects. Preserve their identities.
  Object.assign(local.penalty, saved.local.penalty);
  Object.assign(local.stats, saved.local.stats);
  local.minimizer = saved.local.minimizer;
  local.compressed = saved.local.compressed;
  local.previousViolation = saved.local.previousViolation;
  local.stage = saved.local.stage;
  local.finished = saved.local.finished;
  return {
    ...saved,
    local,
    random: randomSource(saved.random),
  };
};

export type { RelaxCheckpoint };
export { canResumeRelax, checkpointRelax, restoreRelax };

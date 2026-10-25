// biome-ignore-all lint/style/noMagicNumbers: deterministic PRNG and exploration step sizes.
import { type Scene, updateFan } from "./model.ts";
import { constrain, searchVariables, type TightenOptions } from "./search-space.ts";
import { advanceSearch, createSearch, improves } from "./tighten.ts";

const seededRandom = (initial: number) => {
  let seed = initial;
  return () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return (seed - 1) / 2_147_483_646;
  };
};
const restartScene = (
  scene: Scene,
  options: TightenOptions,
  random: () => number,
  restart: number,
) => {
  // Cycle between nearby refinements and wider escapes. Never change frozen fields.
  const amplitude =
    [
      0.25,
      1,
      4,
      0.05,
    ][restart % 4] ?? 1;
  let candidate = scene;
  for (const { fanId, field } of searchVariables(scene, options)) {
    const fan = candidate.fans.find((item) => item.id === fanId);
    if (!fan) {
      continue;
    }
    const linear = field === "orbit" || field === "x" || field === "y";
    const offset = (random() * 2 - 1) * amplitude * (linear ? 0.15 : 12);
    const value = Number(constrain(field, fan[field] + offset).toFixed(6));
    candidate = updateFan(candidate, fanId, {
      [field]: value,
    });
  }
  return candidate;
};
const createExploration = (scene: Scene, options: TightenOptions) => {
  const local = createSearch(scene, options);
  return {
    best: local.best,
    evaluations: 1,
    finished: local.directions.length === 0,
    initial: local.best.scene,
    local,
    options,
    random: seededRandom(options.seed ?? 42),
    restarts: 0,
  };
};
type Exploration = ReturnType<typeof createExploration>;
const advanceExploration = (search: Exploration) => {
  if (search.finished) {
    return search;
  }
  if (search.local.finished) {
    search.restarts += 1;
    const base = search.restarts % 5 === 0 ? search.initial : search.best.scene;
    search.local = createSearch(
      restartScene(base, search.options, search.random, search.restarts),
      search.options,
    );
    search.evaluations += 1;
  } else {
    const before = search.local.evaluations;
    advanceSearch(search.local);
    search.evaluations += search.local.evaluations - before;
  }
  // Trial restarts may be worse or overlap. Only the best valid incumbent reaches the UI.
  if (improves(search.local.best, search.best)) {
    search.best = search.local.best;
  }
  return search;
};

export { advanceExploration, createExploration };

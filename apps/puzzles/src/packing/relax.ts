// biome-ignore-all lint/style/noMagicNumbers: basin acceptance, exploration, and candidate validation thresholds.
import type { Scene } from "./model.ts";
import { packingFingerprint } from "./relax-diversity.ts";
import { createEnsemble, nextEnsemble } from "./relax-ensemble.ts";
import {
  acceptsBasin,
  type Basin,
  contactSignature,
  randomSource,
  rememberBasin,
  shakeBasin,
} from "./relax-hopping.ts";
import { advanceLocalRelax, createLocalRelax } from "./relax-local.ts";
import { createRelaxModel, movingShapes, relaxScene } from "./relax-model.ts";
import type { TightenOptions } from "./search-space.ts";
import { evaluateScene, improves } from "./tighten.ts";

const createRelax = (scene: Scene, options: TightenOptions, threefold: boolean) => {
  const best = evaluateScene(structuredClone(scene));
  if (best.overlaps > 0) {
    throw new Error("Relax needs a collision-free start. Resolve the overlaps with Tighten first.");
  }
  const model = createRelaxModel(scene, options, threefold);
  const basin: Basin = {
    fingerprint: packingFingerprint(movingShapes(model, model.vector)),
    radius: best.radius,
    signature: contactSignature(model, model.vector),
    vector: [
      ...model.vector,
    ],
  };
  return {
    accepted: 0,
    amplitude: 0.25,
    best,
    bestBasin: basin,
    completedEvaluations: 0,
    ensemble: createEnsemble(basin),
    evaluations: 1,
    finished: model.variables.length === 0,
    iterations: 0,
    local: createLocalRelax(model, model.vector),
    localBest: null as Basin | null,
    model,
    pool: [
      basin,
    ],
    random: randomSource(options.seed ?? 42),
    reason: "Compressing with coordinated moves…",
    restarts: 0,
    validationCount: 1,
    walker: basin,
  };
};
type RelaxSearch = ReturnType<typeof createRelax>;
const retainCandidate = (search: RelaxSearch) => {
  const vector = search.local.minimizer.vector;
  const candidate = evaluateScene(relaxScene(search.model, vector));
  search.validationCount += 1;
  if (candidate.overlaps > 0) {
    return;
  }
  const basin: Basin = {
    radius: candidate.radius,
    signature: "",
    vector: [
      ...vector,
    ],
  };
  if (!search.localBest || basin.radius < search.localBest.radius) {
    search.localBest = basin;
  }
  if (improves(candidate, search.best)) {
    search.best = candidate;
    // Local completion fills in its own basin metadata. Keep the incumbent
    // independent so JSON checkpoints do not depend on shared object identity.
    search.bestBasin = {
      ...basin,
    };
  }
};
const nextBasin = (search: RelaxSearch) => {
  const candidate = search.localBest;
  if (candidate) {
    candidate.signature = contactSignature(search.model, candidate.vector);
    candidate.fingerprint = packingFingerprint(movingShapes(search.model, candidate.vector));
    rememberBasin(search.pool, candidate);
    const temperature = 0.004 + 0.025 * ((search.restarts % 20) / 20);
    if (acceptsBasin(candidate.radius, search.walker.radius, temperature, search.random())) {
      search.walker = candidate;
      search.accepted += 1;
    }
  }
  search.restarts += 1;
  if (search.restarts % 10 === 0) {
    search.amplitude = Math.max(
      0.08,
      Math.min(0.9, search.amplitude * (search.accepted >= 4 ? 1.25 : 0.8)),
    );
    search.accepted = 0;
  }
  const vector = search.model.cartesian
    ? nextEnsemble(search.ensemble, search.model, {
        best: search.bestBasin,
        candidate,
        random: search.random,
        restart: search.restarts,
      })
    : shakeBasin(search.model, {
        amplitude: search.amplitude,
        best: search.bestBasin,
        pool: search.pool,
        random: search.random,
        restart: search.restarts,
        walker: search.walker,
      });
  search.completedEvaluations += search.local.stats.evaluations;
  search.local = createLocalRelax(search.model, vector);
  search.localBest = null;
};
const advanceRelax = (search: RelaxSearch, deadline = Number.POSITIVE_INFINITY) => {
  if (search.finished || performance.now() >= deadline) {
    return search;
  }
  const point = advanceLocalRelax(search.local, deadline);
  search.iterations += 1;
  if (point.pairViolation < 1e-5) {
    retainCandidate(search);
  }
  search.reason =
    search.local.control.target === null
      ? search.local.stage > 2
        ? "Closing contacts and validating…"
        : search.restarts > 0
          ? "Settling a new arrangement…"
          : "Compressing with coordinated moves…"
      : "Rearranging inside a smaller trial circle…";
  if (search.local.finished && performance.now() < deadline) {
    nextBasin(search);
    search.reason = "Shaking the arrangement to change contacts…";
  }
  search.evaluations =
    search.completedEvaluations + search.local.stats.evaluations + search.validationCount;
  return search;
};

export type { RelaxSearch };
export { advanceRelax, createRelax };

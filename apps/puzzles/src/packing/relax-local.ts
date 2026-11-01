// biome-ignore-all lint/style/noMagicNumbers: augmented-Lagrangian continuation and convergence thresholds.
import { advanceMinimizer, createMinimizer } from "./lbfgs.ts";
import { packingEnergy } from "./relax-energy.ts";
import { projectParameters, type RelaxModel } from "./relax-model.ts";

const createLocalRelax = (model: RelaxModel, vector: number[], target: number | null = null) => {
  const control = {
    target,
  };
  const penalty = {
    multipliers: [] as number[],
    weight: target === null ? 40 : 1,
  };
  const stats = {
    evaluations: 0,
  };
  const objective = (point: number[]) => {
    stats.evaluations += 1;
    const energy = packingEnergy(model, point, penalty);
    if (control.target !== null) {
      energy.value -= control.target;
      energy.gradient[model.radiusAxis] = 0;
    }
    return energy;
  };
  const project = (point: number[]) => {
    const projected = projectParameters(model, point);
    if (control.target !== null) {
      projected[model.radiusAxis] = control.target;
    }
    return projected;
  };
  const minimizer = createMinimizer(project(vector), objective);
  return {
    compressed: null as {
      vector: number[];
      stress: number;
    } | null,
    control,
    finished: false,
    finishWhenFeasible: model.cartesian,
    minimizer,
    objective,
    penalty,
    previousViolation: Number.MAX_VALUE,
    project,
    stage: 0,
    stats,
  };
};
type LocalRelax = ReturnType<typeof createLocalRelax>;
const advanceLocalRelax = (local: LocalRelax, deadline: number) => {
  advanceMinimizer(local.minimizer, local.objective, local.project, deadline);
  const point = local.objective(local.minimizer.vector);
  const compressing = local.control.target !== null;
  const stationary = Math.max(...point.gradient.map(Math.abs)) < (compressing ? 1e-8 : 1e-6);
  if (compressing) {
    if (local.minimizer.stalled || stationary || local.minimizer.iterations >= 1000) {
      local.compressed = {
        stress: point.value,
        vector: [
          ...local.minimizer.vector,
        ],
      };
      local.control.target = null;
      local.finished = point.value > 0.0002;
      local.penalty.weight = 40;
      local.penalty.multipliers = [];
      local.minimizer = createMinimizer(local.minimizer.vector, local.objective);
    }
    return point;
  }
  if (local.minimizer.stalled || stationary || local.minimizer.iterations >= 120) {
    local.stage += 1;
    local.finished =
      local.stage >= 12 ||
      ((local.finishWhenFeasible || local.minimizer.stalled || stationary) &&
        point.violation < 1e-7);
    if (!local.finished) {
      local.penalty.multipliers = point.gaps.map((gap, i) =>
        Math.max(0, (local.penalty.multipliers[i] ?? 0) - local.penalty.weight * gap),
      );
      if (point.violation > local.previousViolation * 0.4) {
        local.penalty.weight = Math.min(1e8, local.penalty.weight * 5);
      }
      local.previousViolation = point.violation;
      local.minimizer = createMinimizer(local.minimizer.vector, local.objective);
    }
  }
  return point;
};

export { advanceLocalRelax, createLocalRelax };

// biome-ignore-all lint/style/noMagicNumbers: replica temperatures, archive size and exploration bounds.
import { enclosingCircle } from "./enclosure.ts";
import { explorePacking } from "./relax-explore.ts";
import { acceptsBasin, type Basin } from "./relax-hopping.ts";
import { movingShapes, projectParameters, type RelaxModel, searchCenter } from "./relax-model.ts";
import { packingTopology } from "./relax-topology.ts";

const createEnsemble = (basin: Basin) => ({
  active: 0,
  cycles: 0,
  pool: [] as Basin[],
  replicas: [
    0.002,
    0.006,
    0.015,
    0.035,
    0.08,
    0.2,
  ].map((temperature) => ({
    basin,
    temperature,
  })),
  swaps: 0,
});
type Ensemble = ReturnType<typeof createEnsemble>;

// A low-radius replica may inherit a useful arrangement explored at higher
// temperature. Keep temperatures attached to slots when exchanging their basins.
const exchangeReplicas = (state: Ensemble, random: () => number) => {
  for (let i = state.cycles % 2; i < state.replicas.length - 1; i += 2) {
    const a = state.replicas[i];
    const b = state.replicas[i + 1];
    if (a && b) {
      const probability = Math.exp(
        (1 / a.temperature - 1 / b.temperature) * (a.basin.radius - b.basin.radius),
      );
      if (random() < probability) {
        [a.basin, b.basin] = [
          b.basin,
          a.basin,
        ];
        state.swaps += 1;
      }
    }
  }
  state.cycles += 1;
};

const normalizeBasin = (model: RelaxModel, candidate: Basin): Basin => {
  const vector = [
    ...candidate.vector,
  ];
  const circle = enclosingCircle(movingShapes(model, vector));
  const center = searchCenter(model, vector);
  for (const axes of model.axes) {
    vector[axes.orbit] = (vector[axes.orbit] ?? 0) - circle.x + center.x;
    vector[axes.phase] = (vector[axes.phase] ?? 0) - circle.y + center.y;
  }
  vector[model.radiusAxis] = candidate.radius;
  return {
    ...candidate,
    signature: packingTopology(movingShapes(model, vector), {
      ...center,
      radius: candidate.radius,
    }),
    vector,
  };
};

const nextEnsemble = (
  state: Ensemble,
  model: RelaxModel,
  {
    best,
    candidate,
    restart,
    random,
  }: {
    best: Basin;
    candidate: Basin | null;
    restart: number;
    random: () => number;
  },
) => {
  const replica = state.replicas[state.active];
  if (candidate && replica) {
    const basin = normalizeBasin(model, candidate);
    if (acceptsBasin(basin.radius, replica.basin.radius, replica.temperature, random())) {
      replica.basin = basin;
    }
    const old = state.pool.findIndex((item) => item.signature === basin.signature);
    if (old < 0 || (state.pool[old]?.radius ?? 0) > basin.radius) {
      if (old >= 0) {
        state.pool.splice(old, 1);
      }
      state.pool.push(basin);
      state.pool.sort((a, b) => a.radius - b.radius);
      state.pool.length = Math.min(150, state.pool.length);
    }
  }
  state.active = (state.active + 1) % state.replicas.length;
  if (state.active === 0) {
    exchangeReplicas(state, random);
  }
  const source =
    restart % 11 === 0 && state.pool.length > 0
      ? state.pool[Math.floor(random() * state.pool.length)]
      : state.replicas[state.active]?.basin;
  const vector = explorePacking(model, source?.vector ?? best.vector, random);
  // Let a trial pass through a larger valid packing. Restricting every restart
  // to a circle already smaller than the incumbent repeatedly missed such paths.
  vector[model.radiusAxis] = Math.max(
    best.radius + 0.1,
    Math.min(best.radius + 1.25, (source?.radius ?? best.radius) + 0.15),
  );
  return projectParameters(model, vector);
};

export { createEnsemble, exchangeReplicas, nextEnsemble };

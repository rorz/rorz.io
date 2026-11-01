// biome-ignore-all lint/style/noMagicNumbers: line search, curvature, and convergence tolerances.
type ValueGradient = {
  value: number;
  gradient: number[];
};
type Correction = {
  s: number[];
  y: number[];
  inverse: number;
};
type Objective = (vector: number[]) => ValueGradient;
const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
const createMinimizer = (vector: number[], objective: Objective) => ({
  history: [] as Correction[],
  iterations: 0,
  point: objective(vector),
  stalled: false,
  vector: [
    ...vector,
  ],
});
type Minimizer = ReturnType<typeof createMinimizer>;
const directionFor = ({ point, history }: Minimizer) => {
  const q = [
    ...point.gradient,
  ];
  const alphas: number[] = [];
  for (const item of history.toReversed()) {
    const alpha = item.inverse * dot(item.s, q);
    alphas.unshift(alpha);
    for (let i = 0; i < q.length; i += 1) {
      q[i] = (q[i] ?? 0) - alpha * (item.y[i] ?? 0);
    }
  }
  const last = history.at(-1);
  const scale = last ? Math.max(1e-8, Math.min(1e8, 1 / (last.inverse * dot(last.y, last.y)))) : 1;
  const direction = q.map((value) => value * scale);
  for (const [index, item] of history.entries()) {
    const beta = item.inverse * dot(item.y, direction);
    for (let i = 0; i < direction.length; i += 1) {
      direction[i] = (direction[i] ?? 0) + ((alphas[index] ?? 0) - beta) * (item.s[i] ?? 0);
    }
  }
  return direction.map((value) => -value);
};
// Limited-memory BFGS with a safeguarded Armijo line search. Bound projection is
// supplied by the caller; the acceptance test uses the actual projected step.
const advanceMinimizer = (
  state: Minimizer,
  objective: Objective,
  project: (vector: number[]) => number[],
  deadline = Number.POSITIVE_INFINITY,
) => {
  if (state.stalled || performance.now() >= deadline) {
    return;
  }
  let direction = directionFor(state);
  if (dot(direction, state.point.gradient) >= -1e-18) {
    direction = state.point.gradient.map((value) => -value);
    state.history = [];
  }
  const norm = Math.max(...direction.map(Math.abs));
  let length = norm > 0.3 ? 0.3 / norm : 1;
  for (let trial = 0; trial < 24; trial += 1) {
    if (performance.now() >= deadline) {
      return;
    }
    const trialLength = length;
    const vector = project(
      state.vector.map((value, i) => value + trialLength * (direction[i] ?? 0)),
    );
    const s = vector.map((value, i) => value - (state.vector[i] ?? 0));
    const slope = dot(s, state.point.gradient);
    const point = objective(vector);
    if (
      slope < 0 &&
      Number.isFinite(point.value) &&
      point.value <= state.point.value + 1e-4 * slope
    ) {
      const y = point.gradient.map((value, i) => value - (state.point.gradient[i] ?? 0));
      const curvature = dot(s, y);
      if (curvature > 1e-10 * Math.sqrt(dot(s, s) * dot(y, y))) {
        state.history.push({
          inverse: 1 / curvature,
          s,
          y,
        });
        if (state.history.length > 12) {
          state.history.shift();
        }
      }
      state.vector = vector;
      state.point = point;
      state.iterations += 1;
      state.stalled = Math.max(...s.map(Math.abs)) < 1e-11;
      return;
    }
    length /= 2;
  }
  state.stalled = true;
};

export { advanceMinimizer, createMinimizer };

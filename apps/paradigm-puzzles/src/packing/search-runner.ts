// biome-ignore-all lint/style/noMagicNumbers: milliseconds and progress reporting cadence.
import { advanceExploration, createExploration } from "./search-restarts.ts";
import type { SearchRequest, SearchUpdate } from "./tighten.ts";

const runSearch = (request: SearchRequest, report: (update: SearchUpdate) => void) => {
  const started = performance.now();
  let lastReport = started;
  const search = createExploration(request.scene, request.options);
  const initial = {
    overlaps: search.best.overlaps,
    radius: search.best.radius,
  };
  const budget = request.options.seconds * 1000;
  const progress = (finished: boolean): SearchUpdate => ({
    best: search.best,
    elapsed: performance.now() - started,
    evaluations: search.evaluations,
    finished,
    initial,
    reason: finished
      ? search.finished
        ? "No adjustable settings"
        : "Time budget reached"
      : search.best.overlaps > 0
        ? "Repairing overlaps…"
        : search.restarts === 0
          ? "Refining starting arrangement…"
          : "Exploring nearby arrangements…",
    restarts: search.restarts,
    scale: search.local.scale,
    seed: request.options.seed ?? 42,
  });
  while (!search.finished && performance.now() - started < budget) {
    advanceExploration(search);
    const now = performance.now();
    if (now - lastReport > 100) {
      report(progress(false));
      lastReport = now;
    }
  }
  report(progress(true));
};

export { runSearch };

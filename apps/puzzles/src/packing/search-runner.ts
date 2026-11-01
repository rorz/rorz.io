// biome-ignore-all lint/style/noMagicNumbers: milliseconds and progress reporting cadence.

import { advanceRelax, createRelax } from "./relax.ts";
import { canResumeRelax, checkpointRelax, restoreRelax } from "./relax-checkpoint.ts";
import { advanceExploration, createExploration } from "./search-restarts.ts";
import { searchDuration } from "./search-space.ts";
import type { SearchRequest, SearchUpdate } from "./tighten.ts";

const runSearch = (request: SearchRequest, report: (update: SearchUpdate) => void) => {
  const started = performance.now();
  let lastReport = started;
  const search = createExploration(request.scene, request.options);
  const initial = {
    overlaps: search.best.overlaps,
    radius: search.best.radius,
  };
  const budget = searchDuration(request.options.seconds) * 1000;
  const progress = (finished: boolean): SearchUpdate => ({
    best: search.best,
    elapsed: performance.now() - started,
    evaluations: search.evaluations,
    finished,
    initial,
    mode: "tighten",
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

const runRelax = (request: SearchRequest, report: (update: SearchUpdate) => void) => {
  const started = performance.now();
  const deadline = started + searchDuration(request.options.seconds) * 1000;
  const search =
    request.checkpoint && canResumeRelax(request.checkpoint, request.scene, request.options)
      ? restoreRelax(request.checkpoint)
      : createRelax(request.scene, request.options, request.options.threefold ?? true);
  const initial = {
    overlaps: search.best.overlaps,
    radius: search.best.radius,
  };
  let lastReport = started;
  const progress = (finished: boolean): SearchUpdate => ({
    best: search.best,
    checkpoint: checkpointRelax(search, request.options),
    elapsed: performance.now() - started,
    evaluations: search.evaluations,
    finished,
    initial,
    mode: "relax",
    reason: finished
      ? search.finished
        ? "No adjustable settings"
        : "Time budget reached"
      : search.reason,
    restarts: search.restarts,
    scale: search.amplitude,
    seed: request.options.seed ?? 42,
  });
  while (!search.finished && performance.now() < deadline) {
    advanceRelax(search, deadline);
    if (performance.now() - lastReport > 100) {
      report(progress(false));
      lastReport = performance.now();
    }
  }
  report(progress(true));
};

export { runRelax, runSearch };

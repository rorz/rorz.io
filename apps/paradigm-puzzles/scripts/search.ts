// biome-ignore-all lint/style/noMagicNumbers: command-line limits and progress cadence.

// biome-ignore lint/correctness/noNodejsModules: This Bun-only CLI writes progress to stdout.
import process from "node:process";
import { argv, file, write } from "bun";
import { generateShapes } from "../src/packing/model.ts";
import { advanceRelax, createRelax } from "../src/packing/relax.ts";
import { checkpointRelax } from "../src/packing/relax-checkpoint.ts";
import { defaultTightenOptions, MAX_SEARCH_SECONDS } from "../src/packing/search-space.ts";
import { validScene } from "../src/packing/snapshot-schema.ts";

const [input, output, duration = "600", seedText = "42", iterationText = "Infinity"] =
  argv.slice(2);
if (!(input && output)) {
  throw new Error(
    "Usage: search <scene.json> <output-prefix> [seconds=600] [seed=42] [iterations]",
  );
}
const seconds = Number(duration);
const seed = Number(seedText);
const iterations = Number(iterationText);
if (
  !Number.isFinite(seconds) ||
  seconds < 1 ||
  seconds > MAX_SEARCH_SECONDS ||
  !Number.isSafeInteger(seed) ||
  seed < 1 ||
  seed > 999_999 ||
  !(iterations > 0 && (Number.isSafeInteger(iterations) || iterations === Number.POSITIVE_INFINITY))
) {
  throw new Error("Use 1–600 seconds, seed 1–999999, and an optional positive iteration count.");
}
const scene: unknown = await file(input).json();
if (!validScene(scene)) {
  throw new Error("Input must be Inspector → Scene JSON.");
}
const options = {
  ...defaultTightenOptions(),
  seconds,
  seed,
  threefold: false,
};
const search = createRelax(scene, options, false);
const started = performance.now();
const deadline = started + seconds * 1000;
let lastReport = started;
const initial = search.best.radius;
while (!search.finished && search.iterations < iterations && performance.now() < deadline) {
  advanceRelax(search, deadline);
  const now = performance.now();
  if (now - lastReport >= 5000) {
    process.stdout.write(
      `${((now - started) / 1000).toFixed(1)}s  R=${search.best.radius.toFixed(9)}  restarts=${search.restarts}\n`,
    );
    lastReport = now;
  }
}
const report = {
  evaluations: search.evaluations,
  initialRadius: initial,
  iterations: search.iterations,
  overlaps: search.best.overlaps,
  radius: search.best.radius,
  restarts: search.restarts,
  seconds: (performance.now() - started) / 1000,
  seed,
};
const placements = generateShapes(search.best.scene).map(({ x, y, theta }) => ({
  theta,
  x,
  y,
}));
await write(`${output}.scene.json`, JSON.stringify(search.best.scene, null, 2));
await write(`${output}.placements.json`, JSON.stringify(placements, null, 2));
await write(`${output}.report.json`, JSON.stringify(report, null, 2));
await write(`${output}.checkpoint.json`, JSON.stringify(checkpointRelax(search, options)));
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

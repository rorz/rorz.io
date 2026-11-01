// biome-ignore-all lint/style/noMagicNumbers: seeded basin-hopping moves and annealing schedule.
import { separatingAxis } from "./clearance.ts";
import { farthestPoint } from "./enclosure.ts";
import { samePacking } from "./relax-diversity.ts";
import { movingShapes, projectParameters, type RelaxModel, searchCenter } from "./relax-model.ts";
import { rebuildPacking } from "./relax-rebuild.ts";

type Basin = {
  fingerprint?: number[];
  radius: number;
  vector: number[];
  signature: string;
};
const randomSource = (seed: number) => {
  let state = Math.max(1, Math.trunc(seed) % 2_147_483_647);
  const next = () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
  next.state = () => state;
  return next;
};
const contactSignature = (model: RelaxModel, vector: number[]) => {
  const shapes = movingShapes(model, vector);
  const contacts: string[] = [];
  for (const [i, a] of shapes.entries()) {
    for (let j = i + 1; j < shapes.length; j += 1) {
      const b = shapes[j];
      if (b && Math.hypot(a.x - b.x, a.y - b.y) < 2.02 && separatingAxis(a, b).gap < 0.002) {
        contacts.push(`${i}:${j}`);
      }
    }
  }
  return contacts.join(",");
};
const rememberBasin = (pool: Basin[], basin: Basin) => {
  const old = pool.findIndex(
    (item) =>
      item.signature === basin.signature || samePacking(item.fingerprint, basin.fingerprint),
  );
  if (old >= 0 && (pool[old]?.radius ?? 0) <= basin.radius) {
    return;
  }
  if (old >= 0) {
    pool.splice(old, 1);
  }
  pool.push(basin);
  pool.sort((a, b) => a.radius - b.radius);
  if (pool.length > 8) {
    pool.pop();
  }
};
const acceptsBasin = (candidate: number, current: number, temperature: number, draw: number) =>
  candidate <= current || draw < Math.exp((current - candidate) / temperature);
type HopOptions = {
  best: Basin;
  walker: Basin;
  pool: Basin[];
  restart: number;
  amplitude: number;
  random: () => number;
};
const shakeBasin = (model: RelaxModel, options: HopOptions) => {
  const { random, restart, amplitude } = options;
  const selection = random();
  const base =
    selection < 0.45
      ? options.best
      : selection < 0.75
        ? options.walker
        : (options.pool[Math.floor(random() * options.pool.length)] ?? options.best);
  if (model.cartesian) {
    return projectParameters(model, rebuildPacking(model, base.vector, restart, random));
  }
  const vector = [
    ...base.vector,
  ];
  const kind = restart % 5;
  const selected = Math.floor(random() * model.template.fans.length);
  const other =
    (selected + 1 + Math.floor(random() * Math.max(1, model.template.fans.length - 1))) %
    model.template.fans.length;
  const selectedId = model.template.fans[selected]?.id;
  const otherId = model.template.fans[other]?.id;
  for (const [index, variable] of model.variables.entries()) {
    const value = vector[index] ?? 0;
    const noise = (random() * 2 - 1) * amplitude;
    const focused = variable.fanId === selectedId || variable.fanId === otherId;
    if (kind === 0) {
      vector[index] = value + noise * 0.15;
    } else if (kind === 1) {
      vector[index] = value + (focused ? noise : noise * 0.05);
    } else if (kind === 2) {
      // Opening space before reorientation lets the local solve change neighbours.
      vector[index] = variable.field === "orbit" ? value * (1 + amplitude * 0.2) : value + noise;
    } else if (kind === 3) {
      const donor = options.pool[Math.floor(random() * options.pool.length)] ?? options.best;
      const raw = (donor.vector[index] ?? value) - value;
      const difference =
        variable.field === "orbit" ? raw : Math.atan2(Math.sin(raw), Math.cos(raw));
      vector[index] = value + 0.7 * difference + noise * 0.3;
    } else if (focused) {
      // Exchange radial roles, retaining each group's orientation and all locks.
      const partner = variable.fanId === selectedId ? otherId : selectedId;
      const axis = model.variables.findIndex(
        (item) => item.fanId === partner && item.field === variable.field,
      );
      vector[index] =
        variable.field === "orbit" && axis >= 0 ? (base.vector[axis] ?? value) : value + noise;
    }
  }
  const projected = projectParameters(model, vector);
  const center = searchCenter(model, projected);
  projected[model.radiusAxis] = Math.max(
    ...movingShapes(model, projected).map((shape) => {
      const point = farthestPoint(shape, center);
      return Math.hypot(point.x - center.x, point.y - center.y);
    }),
  );
  return projected;
};

export type { Basin };
export { acceptsBasin, contactSignature, randomSource, rememberBasin, shakeBasin };

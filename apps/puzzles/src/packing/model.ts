// biome-ignore-all lint/style/noMagicNumbers: angles, unit geometry, and editor limits are explicit here.
type Point = {
  x: number;
  y: number;
};
type Placement = Point & {
  theta: number;
};
type Shape = Placement & {
  id: string;
  fanId: string;
};
type Fan = Point & {
  id: string;
  count: number;
  orbit: number;
  phase: number;
  spread: number;
  tilt: number;
  holdTilt?: boolean;
};
type Scene = {
  fans: Fan[];
  linked: boolean;
};
type Circle = Point & {
  radius: number;
  error: number;
};
type Collision = {
  a: string;
  b: string;
  area: number;
};

const TAU = Math.PI * 2;
const OVERLAP_TOLERANCE = 1e-6;
const MAX_SHAPES = 120;
const degrees = (value: number) => (value * Math.PI) / 180;
const roundExport = (value: number) => Number(value.toFixed(6)) || 0;
// Normalize before rounding so a validator cannot shift the six-decimal grid.
const roundAngle = (angle: number) => {
  const rounded = roundExport(Math.atan2(Math.sin(angle), Math.cos(angle)));
  return Math.abs(rounded) > Math.PI ? roundExport(rounded - Math.sign(rounded) * TAU) : rounded;
};
const makeFan = (id: string): Fan => ({
  count: 3,
  id,
  orbit: 0.7,
  phase: 0,
  spread: 360,
  tilt: 75,
  x: 0,
  y: 0,
});
const initialScene = (): Scene => ({
  fans: [
    {
      ...makeFan("1"),
      count: 12,
      orbit: 2.5,
    },
    makeFan("2"),
  ],
  linked: true,
});

// A full ring has no repeated endpoint; a partial fan includes both ends.
const generateShapes = (scene: Scene, fullPrecision = false): Shape[] =>
  scene.fans.flatMap((fan) => {
    const divisor = fan.spread === 360 ? fan.count : Math.max(1, fan.count - 1);
    return Array.from(
      {
        length: fan.count,
      },
      (_, index) => {
        const angle = degrees(fan.phase + (index * fan.spread) / divisor);
        const theta = angle + degrees(fan.tilt);
        const x = fan.x + fan.orbit * Math.cos(angle);
        const y = fan.y + fan.orbit * Math.sin(angle);
        return {
          fanId: fan.id,
          id: `${fan.id}.${index + 1}`,
          theta: fullPrecision ? Math.atan2(Math.sin(theta), Math.cos(theta)) : roundAngle(theta),
          x: fullPrecision ? x : roundExport(x),
          y: fullPrecision ? y : roundExport(y),
        };
      },
    );
  });

const exportPlacements = (shapes: Shape[]): Placement[] =>
  shapes.map(({ theta, x, y }) => ({
    theta,
    x,
    y,
  }));

// Shorten the fan by one endpoint while retaining the original angular spacing.
const removeLastSemicircle = (fan: Fan): Fan => {
  if (fan.count <= 1) {
    return fan;
  }
  const spacing = fan.spread / (fan.spread === 360 ? fan.count : fan.count - 1);
  return {
    ...fan,
    count: fan.count - 1,
    spread: spacing * (fan.count - 2),
  };
};

const updateFan = (scene: Scene, id: string, patch: Partial<Fan>): Scene => ({
  ...scene,
  fans: scene.fans.map((fan) => ({
    ...fan,
    ...(fan.id === id ? patch : {}),
    ...(scene.linked && patch.tilt !== undefined
      ? {
          tilt: patch.tilt,
        }
      : {}),
  })),
});

export type { Circle, Collision, Fan, Placement, Point, Scene, Shape };
export {
  exportPlacements,
  generateShapes,
  initialScene,
  MAX_SHAPES,
  makeFan,
  OVERLAP_TOLERANCE,
  removeLastSemicircle,
  TAU,
  updateFan,
};

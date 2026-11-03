// biome-ignore-all lint/style/noMagicNumbers: These values define the decorative bar pattern's geometry and seed.
const PATTERN_WIDTH = 800;
const PATTERN_HEIGHT = 60;
const BAR_WIDTH = 2; // CSS pixels, independent of the page width.

const createBars = () => {
  // Keep the irregular pattern stable across server rendering and hydration.
  let seed = 2026;
  const random = () => {
    // biome-ignore lint/suspicious/noBitwiseOperators: Keep the seeded generator within an unsigned 32-bit integer.
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    return seed / 2 ** 32;
  };
  const bars: {
    height: number;
    x: number;
  }[] = [];
  let x = 0;

  while (x < PATTERN_WIDTH) {
    const broad = random() < 0.12;
    const span = broad ? 5 + Math.floor(random() * 8) : 1 + Math.floor(random() ** 2 * 4);
    const height = 6 + Math.floor(random() ** 1.5 * (PATTERN_HEIGHT - 6));
    bars.push({
      height,
      x,
    });
    x += span + (broad ? 4 : 1) + Math.floor(random() * 5);
  }

  return bars;
};

const bars = createBars();

const TopBars = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full stroke-red-800/40"
    preserveAspectRatio="none"
    shapeRendering="crispEdges"
    viewBox={`0 0 ${PATTERN_WIDTH} ${PATTERN_HEIGHT}`}
  >
    {bars.map((bar) => (
      <line
        key={bar.x}
        strokeWidth={BAR_WIDTH}
        vectorEffect="non-scaling-stroke"
        x1={bar.x}
        x2={bar.x}
        y1={0}
        y2={bar.height}
      />
    ))}
  </svg>
);

export { TopBars };

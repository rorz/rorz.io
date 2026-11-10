const SCENE_WIDTH = 1584;
const SCENE_HEIGHT = 396;
const ROW_HEIGHT = 14;
const RED_THREAD_X = 444;
const PAIR_COMPLEMENT_CHANCE = 0.92;
const LONG_BAR_MIN = 24;
const TIGHT_GAP_CHANCE = 0.12;

const textures = {
  broad: {
    bias: 1.5,
    gap: [
      4,
      14,
    ],
    width: [
      26,
      100,
    ],
  },
  fine: {
    bias: 3,
    gap: [
      1,
      2,
    ],
    width: [
      1,
      9,
    ],
  },
  mixed: {
    bias: 2,
    gap: [
      1,
      4,
    ],
    width: [
      2,
      24,
    ],
  },
  sparse: {
    bias: 2,
    gap: [
      2,
      8,
    ],
    width: [
      3,
      18,
    ],
  },
} as const;

type TextureName = keyof typeof textures;
interface GroupStyle {
  readonly textures: readonly [
    TextureName,
    ...TextureName[],
  ];
  readonly pause: readonly [
    number,
    number,
  ];
}

const groupStyles = [
  {
    pause: [
      4,
      16,
    ],
    textures: [
      "fine",
      "fine",
      "mixed",
    ],
  },
  {
    pause: [
      12,
      36,
    ],
    textures: [
      "broad",
      "sparse",
      "sparse",
      "mixed",
    ],
  },
  {
    pause: [
      2,
      10,
    ],
    textures: [
      "fine",
      "mixed",
      "mixed",
    ],
  },
  {
    pause: [
      16,
      42,
    ],
    textures: [
      "sparse",
      "sparse",
      "fine",
    ],
  },
  {
    pause: [
      8,
      24,
    ],
    textures: [
      "broad",
      "broad",
      "sparse",
      "fine",
    ],
  },
] as const satisfies readonly GroupStyle[];

const characterRanges = [
  [
    0x00_30,
    0x00_7a,
  ], // Latin and digits
  [
    0x00_c0,
    0x02_4f,
  ], // Extended Latin
  [
    0x03_70,
    0x03_ff,
  ], // Greek
  [
    0x04_00,
    0x04_ff,
  ], // Cyrillic
  [
    0x05_31,
    0x05_86,
  ], // Armenian
  [
    0x10_a0,
    0x10_ff,
  ], // Georgian
  [
    0x20_70,
    0x20_9f,
  ], // Superscripts and subscripts
  [
    0x21_90,
    0x21_ff,
  ], // Arrows
  [
    0x22_00,
    0x22_ff,
  ], // Mathematics
  [
    0x30_41,
    0x30_96,
  ], // Hiragana
  [
    0x30_a1,
    0x30_fa,
  ], // Katakana
  [
    0x4e_00,
    0x4e_ff,
  ], // CJK
] as const;

const printableGlyph = /[\p{L}\p{N}\p{S}]/u;
const characters = characterRanges
  .flatMap(([start, end]) =>
    Array.from(
      {
        length: end - start + 1,
      },
      (_, index) => String.fromCodePoint(start + index),
    ),
  )
  .filter((character) => printableGlyph.test(character));

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

const drawTextRow = (ctx: CanvasRenderingContext2D, y: number) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, SCENE_WIDTH, ROW_HEIGHT);
  ctx.clip();
  ctx.fillStyle = "white";
  ctx.font = `100 ${Math.round(ROW_HEIGHT * 0.78)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Apple Symbols", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";

  let x = 0;
  while (x < SCENE_WIDTH) {
    const length = randomInt(4, 14);
    let bunch = "";
    for (let index = 0; index < length; index += 1) {
      bunch += characters[randomInt(0, characters.length - 1)] ?? "";
    }
    bunch += ` ${"—".repeat(randomInt(1, 3))} `;
    ctx.fillText(bunch, x, y + ROW_HEIGHT / 2);
    x += ctx.measureText(bunch).width;
  }

  ctx.restore();
};

const barWidth = (name: TextureName, allowLongBar: boolean) => {
  if (allowLongBar && (name === "fine" || name === "mixed") && Math.random() < 0.025) {
    return randomInt(32, 90);
  }
  const texture = allowLongBar ? textures[name] : textures.fine;
  const [min, max] = texture.width;
  return Math.round(min + Math.random() ** texture.bias * (max - min));
};

const barSpacing = (gap: number, adjacentWidth: number) => {
  const spacing = Math.max(1, Math.round(gap * (0.4 + Math.random() * 1.2)));
  if (adjacentWidth < LONG_BAR_MIN) {
    return spacing;
  }
  // Wide bars usually breathe, but occasionally sit very close.
  return Math.random() < TIGHT_GAP_CHANCE
    ? randomInt(1, 2)
    : Math.max(spacing, Math.ceil(adjacentWidth * 0.24));
};

const drawBarRows = (ctx: CanvasRenderingContext2D, y: number, style: GroupStyle) => {
  let x = 0;
  let previousWidth = 0;
  while (x < SCENE_WIDTH) {
    // Keep a texture and spacing for a whole passage, then leave a pause.
    const name = style.textures[randomInt(0, style.textures.length - 1)] ?? style.textures[0];
    const passageEnd = Math.min(SCENE_WIDTH, x + randomInt(90, 220));
    const [minGap, maxGap] = textures[name].gap;
    const gap = randomInt(minGap, maxGap);
    const longBarLimit = Math.random() < 0.1 ? 2 : 1;
    let longBarCount = 0;
    while (x < passageEnd) {
      const allowLongBar = longBarCount < longBarLimit;
      let width = barWidth(name, allowLongBar);
      const firstSpan = previousWidth === 0;
      if (!firstSpan) {
        const localGap = allowLongBar ? gap : Math.min(gap, textures.fine.gap[1]);
        x += barSpacing(localGap, Math.max(previousWidth, width));
      }
      if (x >= SCENE_WIDTH) {
        break;
      }
      width = Math.min(width, SCENE_WIDTH - x);

      // Always start one row at the left edge. Later spans can be empty.
      if (firstSpan || Math.random() < PAIR_COMPLEMENT_CHANCE) {
        const row = randomInt(0, 1);
        ctx.fillStyle = x <= RED_THREAD_X && RED_THREAD_X < x + width ? "#ff0000" : "white";
        ctx.fillRect(x, y + row * ROW_HEIGHT, width, ROW_HEIGHT);
      }
      previousWidth = width;
      if (width >= LONG_BAR_MIN) {
        longBarCount += 1;
      }
      x += width;
    }
    x += randomInt(...style.pause);
  }
};

const drawArtwork = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
  const groupHeight = ROW_HEIGHT * 3;
  for (let group = 0; group * groupHeight < SCENE_HEIGHT; group += 1) {
    const y = group * groupHeight;
    drawBarRows(ctx, y, groupStyles[group % groupStyles.length] ?? groupStyles[0]);
    const textY = y + ROW_HEIGHT * 2;
    if (textY < SCENE_HEIGHT) {
      drawTextRow(ctx, textY);
    }
  }
};

export { drawArtwork, SCENE_HEIGHT, SCENE_WIDTH };

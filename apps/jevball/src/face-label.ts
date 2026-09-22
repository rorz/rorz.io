// biome-ignore-all lint/style/noMagicNumbers: Typography is fitted in the triangle's 512-pixel texture coordinates.
const lineBreaks = (text: string) =>
  text
    .toUpperCase()
    .split(" ")
    .reduce<string[][]>(
      (options, word) =>
        options.flatMap((lines) => {
          const last = lines.at(-1);
          return last
            ? [
                [
                  ...lines.slice(0, -1),
                  `${last} ${word}`,
                ],
                [
                  ...lines,
                  word,
                ],
              ]
            : [
                [
                  word,
                ],
              ];
        }),
      [
        [],
      ],
    );

const fitLines = (lines: string[], measure: (line: string) => number) => {
  let fontSize = 128;
  for (const [index, line] of lines.entries()) {
    const bottom = 0.88 + index * 1.05;
    // The available width decreases toward the triangle's lower point.
    fontSize = Math.min(fontSize, 352 / (measure(line) / 100 + 0.8 * bottom), 320 / bottom);
  }
  return {
    fontSize,
    lines: lines.map((text, index) => ({
      text,
      y: 72 + fontSize * (0.5 + index * 1.05),
    })),
  };
};

const faceLayout = (text: string, measure = (line: string) => line.length * 60) =>
  lineBreaks(text)
    .filter((lines) => lines.length <= 4)
    .map((lines) => fitLines(lines, measure))
    .reduce((best, layout) => (layout.fontSize > best.fontSize ? layout : best));

export { faceLayout };

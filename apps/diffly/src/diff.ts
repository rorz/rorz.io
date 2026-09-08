type DiffLine = readonly [
  prefix: " " | "+" | "-",
  line: string,
];

const normalizeText = (text: string): string => text.replace(/\r\n?/gu, "\n");

const splitLines = (text: string): string[] => {
  const normalized = normalizeText(text);

  if (normalized.length === 0) {
    return [];
  }

  return (normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized).split("\n");
};

const createLcsLookup = (oldLines: readonly string[], newLines: readonly string[]) => {
  const columns = newLines.length + 1;
  const lcs = new Uint32Array((oldLines.length + 1) * columns);
  const lengthAt = (row: number, column: number): number => lcs[row * columns + column] ?? 0;

  for (let row = oldLines.length - 1; row >= 0; row -= 1) {
    for (let column = newLines.length - 1; column >= 0; column -= 1) {
      lcs[row * columns + column] =
        oldLines[row] === newLines[column]
          ? lengthAt(row + 1, column + 1) + 1
          : Math.max(lengthAt(row + 1, column), lengthAt(row, column + 1));
    }
  }

  return lengthAt;
};

const createLineDiff = (oldLines: readonly string[], newLines: readonly string[]): DiffLine[] => {
  const lengthAt = createLcsLookup(oldLines, newLines);
  const result: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];

    if (oldLine !== undefined && newLine !== undefined && oldLine === newLine) {
      result.push([
        " ",
        oldLine,
      ]);
      oldIndex += 1;
      newIndex += 1;
    } else if (
      newLine !== undefined &&
      (oldLine === undefined ||
        lengthAt(oldIndex, newIndex + 1) >= lengthAt(oldIndex + 1, newIndex))
    ) {
      result.push([
        "+",
        newLine,
      ]);
      newIndex += 1;
    } else if (oldLine !== undefined) {
      result.push([
        "-",
        oldLine,
      ]);
      oldIndex += 1;
    }
  }

  return result;
};

const formatRange = (start: number, count: number): string =>
  count === 1 ? `${start}` : `${start},${count}`;

const createDiff = (oldText: string, newText: string, includeGitMetadata: boolean): string => {
  if (normalizeText(oldText) === normalizeText(newText)) {
    return "";
  }

  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const body = createLineDiff(oldLines, newLines).map(([prefix, line]) => `${prefix}${line}`);

  if (!includeGitMetadata) {
    return body.join("\n");
  }

  const oldStart = oldLines.length > 0 ? 1 : 0;
  const newStart = newLines.length > 0 ? 1 : 0;

  return [
    "diff --git a/input.txt b/input.txt",
    "--- a/input.txt",
    "+++ b/input.txt",
    `@@ -${formatRange(oldStart, oldLines.length)} +${formatRange(newStart, newLines.length)} @@`,
    ...body,
  ].join("\n");
};

export { createDiff };

import { expect, test } from "bun:test";
import { renderZedTasks } from "./zed-tasks.ts";

test("app-specific dev and preview tasks keep their server terminals open", () => {
  const tasks = JSON.parse(
    renderZedTasks({
      "build:diffly": "bun run --filter @rorz/diffly build",
      "dev:diffly": "bun run --filter @rorz/diffly dev",
      "start:diffly": "bun run --filter @rorz/diffly start",
    }),
  ) as Readonly<Record<string, unknown>>[];

  expect(
    tasks.map((task) => [
      task.label,
      task.hide,
      task.use_new_terminal,
    ]),
  ).toEqual([
    [
      "bun: build:diffly",
      "on_success",
      false,
    ],
    [
      "bun: dev:diffly",
      "never",
      true,
    ],
    [
      "bun: start:diffly",
      "never",
      true,
    ],
  ]);
});

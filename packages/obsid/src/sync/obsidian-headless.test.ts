import { expect, test } from "bun:test";
import { createRequire } from "node:module";
import { file, spawn } from "bun";
import { getSyncConfigArgs } from "./obsidian-headless.ts";

const require = createRequire(import.meta.url);
const patchedCliPath = require.resolve("obsidian-headless/patched-cli.cjs");

test("loads the case-only path patch into the upstream CLI", async () => {
  const process = spawn(
    [
      "node",
      patchedCliPath,
      "sync",
      "--help",
    ],
    {
      stderr: "pipe",
      stdout: "pipe",
    },
  );
  const [exitCode, stderr, stdout] = await Promise.all([
    process.exited,
    new Response(process.stderr).text(),
    new Response(process.stdout).text(),
  ]);

  expect(stderr).toBe("");
  expect(exitCode).toBe(0);
  expect(stdout).toContain("Usage: ob sync [options]");
});

test("routes case-only collisions through the upstream adapter rename", async () => {
  const patchSource = await file(patchedCliPath).text();

  expect(patchSource).toContain("this.adapter.insensitive");
  expect(patchSource).toContain("this.adapter.rename(n,i)");
});

test("passes excluded folders to the upstream sync configuration", () => {
  expect(
    getSyncConfigArgs({
      excludedFolders: [
        "__templates",
        "__drafts",
      ],
      path: "/tmp/example-vault",
    }),
  ).toEqual([
    "--path",
    "/tmp/example-vault",
    "--mode",
    "mirror-remote",
    "--excluded-folders",
    "__templates,__drafts",
  ]);

  expect(
    getSyncConfigArgs({
      excludedFolders: [],
      path: "/tmp/example-vault",
    }).slice(-2),
  ).toEqual([
    "--excluded-folders",
    "",
  ]);
});

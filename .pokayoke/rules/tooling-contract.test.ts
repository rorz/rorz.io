import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { RuleContext } from "pokayoke";
import { renderZedTasks, requiredScripts, toolingContract } from "./tooling-contract.rule.ts";

const packageJson = {
  dependencies: {
    react: "latest",
    "react-dom": "latest",
  },
  devDependencies: {
    "@biomejs/biome": "latest",
    "@vitejs/plugin-react": "latest",
    "@vitejs/plugin-rsc": "latest",
    knip: "latest",
    pokayoke: "latest",
    "react-server-dom-webpack": "latest",
    typescript: "latest",
    vinext: "latest",
    vite: "latest",
  },
  packageManager: "bun@1.3.14",
  scripts: requiredScripts,
} as const;

const toolingFiles = [
  ".zed/settings.json",
  "biome.json",
  "knip.jsonc",
  "pokayoke.jsonc",
  "tsconfig.json",
];

const createContext = (root: string, fix: boolean): RuleContext => ({
  files: async () => [],
  fix,
  glob: async () => toolingFiles,
  options: undefined,
  packageJson: async () => packageJson,
  parseTypescript: () => Promise.reject(new Error("parseTypescript is not used by this rule.")),
  readFile: async () => "[]\n",
  report: () => undefined,
  root,
  workspaces: async () => [],
});

describe("repo/tooling-contract", () => {
  test("reports Zed task drift", async () => {
    const root = await mkdtemp(`${tmpdir()}/pokayoke-tooling-contract-`);
    const result = await toolingContract.run(createContext(root, false));

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.file).toBe(".zed/tasks.json");
  });

  test("repairs Zed task drift", async () => {
    const root = await mkdtemp(`${tmpdir()}/pokayoke-tooling-contract-`);
    const result = await toolingContract.run(createContext(root, true));
    const tasks = await readFile(`${root}/.zed/tasks.json`, "utf8");

    expect(result.findings).toHaveLength(0);
    expect(tasks).toBe(renderZedTasks(requiredScripts));
  });
});

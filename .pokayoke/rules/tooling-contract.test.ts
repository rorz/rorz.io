import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { RuleContext } from "pokayoke";
import { renderZedTasks, requiredScripts, toolingContract } from "./tooling-contract.rule.ts";

const rootPackageJson = {
  devDependencies: {
    "@biomejs/biome": "latest",
    knip: "latest",
    pokayoke: "latest",
    typescript: "latest",
  },
  packageManager: "bun@1.3.14",
  scripts: requiredScripts,
  workspaces: ["apps/*", "packages/*"],
} as const;

const webPackageJson = {
  dependencies: {
    react: "latest",
    "react-dom": "latest",
  },
  devDependencies: {
    "@tailwindcss/vite": "latest",
    "@vitejs/plugin-react": "latest",
    "@vitejs/plugin-rsc": "latest",
    "react-server-dom-webpack": "latest",
    tailwindcss: "latest",
    typescript: "latest",
    vinext: "latest",
    vite: "latest",
  },
  name: "@rorz/web",
  scripts: {
    build: "vinext build",
    "check:vinext": "vinext check",
    dev: "vinext dev --port 4444",
    start: "vinext start",
    typecheck: "tsc --noEmit",
  },
} as const;

const toolingFiles = [
  ".zed/settings.json",
  "apps/web/package.json",
  "apps/web/tsconfig.json",
  "apps/web/vite.config.ts",
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
  packageJson: (workspace) => {
    if (workspace === "apps/web") {
      return Promise.resolve(webPackageJson);
    }

    return Promise.resolve(rootPackageJson);
  },
  parseTypescript: () => Promise.reject(new Error("parseTypescript is not used by this rule.")),
  readFile: async () => "[]\n",
  report: () => undefined,
  root,
  workspaces: async () => [
    { name: "rorz.io", root: "." },
    { name: "@rorz/web", root: "apps/web" },
    { name: "obsidian-oxide", root: "packages/obsidian" },
  ],
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

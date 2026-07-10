import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Finding, Rule, RuleContext } from "pokayoke";

interface PackageJson {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly packageManager?: string;
  readonly scripts?: Readonly<Record<string, string>>;
}

interface ZedTask {
  readonly allow_concurrent_runs: boolean;
  readonly args: readonly string[];
  readonly command: "bun";
  readonly cwd: "$ZED_WORKTREE_ROOT";
  readonly hide: "never" | "on_success";
  readonly label: string;
  readonly reveal: "always";
  readonly save: "all";
  readonly use_new_terminal: boolean;
}

const ruleId = "repo/tooling-contract";
const expandedArgsPattern = /"args": \[\n {6}"run",\n {6}"([^"]+)"\n {4}\]/gu;
const foreignPackageManagerPattern = /\b(?:npm|npx|pnpm|yarn)\b/u;

const requiredScripts = {
  build: "vinext build",
  check:
    "bun run check:biome && bun run typecheck && bun run knip && bun run test && bun run pokayoke && bun run check:vinext",
  "check:biome": "biome check .",
  "check:biome:fix": "biome check --write --unsafe .",
  "check:vinext": "vinext check",
  dev: "vinext dev",
  format: "biome format --write .",
  "format:check": "biome format .",
  knip: "knip",
  "knip:fix": "knip --fix",
  lint: "biome lint .",
  "lint:fix": "biome lint --write .",
  pokayoke: "pokayoke check",
  "pokayoke:fix": "pokayoke check --fix",
  start: "vinext start",
  test: "bun test app ./.pokayoke/rules/*.test.ts",
  typecheck: "tsc --noEmit",
  verify: "bun run check && bun run build",
} as const;

const requiredRuntimeDependencies = ["react", "react-dom"] as const;

const requiredDevelopmentDependencies = [
  "@biomejs/biome",
  "@vitejs/plugin-react",
  "@vitejs/plugin-rsc",
  "knip",
  "pokayoke",
  "react-server-dom-webpack",
  "typescript",
  "vinext",
  "vite",
] as const;

const requiredFiles = [
  ".zed/settings.json",
  "biome.json",
  "knip.jsonc",
  "pokayoke.jsonc",
  "tsconfig.json",
] as const;

const finding = (message: string, file: string, advice: string): Finding => ({
  advice,
  file,
  message,
  ruleId,
  severity: "error",
});

const createZedTasks = (scripts: Readonly<Record<string, string>>): readonly ZedTask[] =>
  Object.keys(scripts)
    .toSorted()
    .map((script) => {
      const keepsRunning = script === "dev" || script === "start";
      let hide: ZedTask["hide"] = "on_success";

      if (keepsRunning) {
        hide = "never";
      }

      return {
        allow_concurrent_runs: false,
        args: ["run", script],
        command: "bun",
        cwd: "$ZED_WORKTREE_ROOT",
        hide,
        label: `bun: ${script}`,
        reveal: "always",
        save: "all",
        use_new_terminal: keepsRunning,
      };
    });

const renderZedTasks = (scripts: Readonly<Record<string, string>>): string =>
  `${JSON.stringify(createZedTasks(scripts), null, 2)}\n`.replace(
    expandedArgsPattern,
    '"args": ["run", "$1"]',
  );

const validatePackageManager = (packageJson: PackageJson): Finding[] => {
  if (packageJson.packageManager?.startsWith("bun@")) {
    return [];
  }

  return [
    finding(
      "packageManager must pin Bun.",
      "package.json",
      'Set "packageManager" to "bun@<version>".',
    ),
  ];
};

const validateScripts = (scripts: Readonly<Record<string, string>>): Finding[] => {
  const findings: Finding[] = [];

  for (const [script, command] of Object.entries(requiredScripts)) {
    if (scripts[script] !== command) {
      findings.push(
        finding(
          `The ${script} script does not match the tooling contract.`,
          "package.json",
          `Set scripts.${script} to ${JSON.stringify(command)}.`,
        ),
      );
    }
  }

  for (const [script, command] of Object.entries(scripts)) {
    if (foreignPackageManagerPattern.test(command)) {
      findings.push(
        finding(
          `The ${script} script bypasses Bun.`,
          "package.json",
          "Use Bun for package scripts and one-off executables.",
        ),
      );
    }
  }

  return findings;
};

const validateDependencies = (packageJson: PackageJson): Finding[] => {
  const findings: Finding[] = [];

  for (const dependency of requiredRuntimeDependencies) {
    if (!packageJson.dependencies?.[dependency]) {
      findings.push(
        finding(
          `Missing runtime dependency: ${dependency}.`,
          "package.json",
          `Install it with: bun add ${dependency}`,
        ),
      );
    }
  }

  for (const dependency of requiredDevelopmentDependencies) {
    if (!packageJson.devDependencies?.[dependency]) {
      findings.push(
        finding(
          `Missing development dependency: ${dependency}.`,
          "package.json",
          `Install it with: bun add --dev ${dependency}`,
        ),
      );
    }
  }

  return findings;
};

const validateFiles = (files: ReadonlySet<string>): Finding[] => {
  const findings: Finding[] = [];

  for (const file of requiredFiles) {
    if (!files.has(file)) {
      findings.push(
        finding(`Missing tooling file: ${file}.`, file, "Restore the project tooling file."),
      );
    }
  }

  return findings;
};

const validateZedTasks = async (
  context: RuleContext,
  scripts: Readonly<Record<string, string>>,
  files: ReadonlySet<string>,
): Promise<Finding[]> => {
  const expectedTasks = renderZedTasks(scripts);
  let actualTasks = "";

  if (files.has(".zed/tasks.json")) {
    actualTasks = await context.readFile(".zed/tasks.json");
  }

  if (actualTasks === expectedTasks) {
    return [];
  }

  if (context.fix) {
    await mkdir(join(context.root, ".zed"), { recursive: true });
    await writeFile(join(context.root, ".zed/tasks.json"), expectedTasks, "utf8");
    return [];
  }

  return [
    finding(
      "Zed tasks do not mirror package scripts.",
      ".zed/tasks.json",
      "Run `bun run pokayoke:fix` to regenerate every Zed task.",
    ),
  ];
};

const toolingContract: Rule = {
  meta: {
    docs: "Keep Bun, the quality gate, and Zed's project tasks on one exact contract.",
    fixable: true,
    id: ruleId,
    kind: "project",
  },
  async run(context) {
    const packageJson = (await context.packageJson()) as PackageJson;
    const scripts = packageJson.scripts ?? {};
    const files = new Set(await context.glob([...requiredFiles, ".zed/tasks.json"]));
    const findings = [
      ...validatePackageManager(packageJson),
      ...validateScripts(scripts),
      ...validateDependencies(packageJson),
      ...validateFiles(files),
      ...(await validateZedTasks(context, scripts, files)),
    ];

    return { findings };
  },
};

export { createZedTasks, renderZedTasks, requiredScripts, toolingContract };

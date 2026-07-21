import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Finding, Rule, RuleContext } from "pokayoke";
import { renderZedTasks } from "./zed-tasks.ts";

interface PackageJson {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly name?: string;
  readonly packageManager?: string;
  readonly scripts?: Readonly<Record<string, string>>;
  readonly workspaces?: readonly string[];
}

const ruleId = "repo/tooling-contract";
const foreignPackageManagerPattern = /\b(?:npm|npx|pnpm|yarn)\b/u;

const requiredScripts = {
  build: "bun run --filter @rorz/web build",
  check:
    "bun run check:biome && bun run typecheck && bun run knip && bun run test && bun run pokayoke && bun run check:vinext",
  "check:biome": "biome check .",
  "check:biome:fix": "biome check --write .",
  "check:biome:fix:unsafe": "biome check --write --unsafe .",
  "check:vinext": "bun run --filter @rorz/web check:vinext",
  dev: "bun run --filter @rorz/web dev",
  format: "biome format --write .",
  "format:check": "biome format .",
  knip: "knip",
  "knip:fix": "knip --fix",
  lint: "biome lint .",
  "lint:fix": "biome lint --write .",
  pokayoke: "pokayoke check",
  "pokayoke:fix": "pokayoke check --fix",
  start: "bun run --filter @rorz/web start",
  test: "bun test apps packages ./.pokayoke/rules/*.test.ts",
  typecheck:
    "tsc --noEmit && bun run --filter obsid typecheck && bun run --filter @rorz/web typecheck",
  verify: "bun run check && bun run build",
} as const;

const requiredWebScripts = {
  build: "vinext build",
  "check:vinext": "vinext check",
  dev: "vinext dev --port 4444",
  start: "vinext start",
  typecheck: "tsc --noEmit",
} as const;

const requiredRootDevelopmentDependencies = [
  "@biomejs/biome",
  "knip",
  "pokayoke",
  "typescript",
] as const;

const requiredWebRuntimeDependencies = [
  "react",
  "react-dom",
] as const;

const requiredWebDevelopmentDependencies = [
  "@tailwindcss/vite",
  "@vitejs/plugin-react",
  "@vitejs/plugin-rsc",
  "react-server-dom-webpack",
  "tailwindcss",
  "typescript",
  "vinext",
  "vite",
] as const;

const requiredFiles = [
  ".zed/settings.json",
  "apps/web/package.json",
  "apps/web/tsconfig.json",
  "apps/web/vite.config.ts",
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

const validateRootPackage = (packageJson: PackageJson): Finding[] => {
  const findings: Finding[] = [];

  if (!packageJson.packageManager?.startsWith("bun@")) {
    findings.push(
      finding(
        "packageManager must pin Bun.",
        "package.json",
        'Set "packageManager" to "bun@<version>".',
      ),
    );
  }

  for (const workspace of [
    "apps/*",
    "packages/*",
  ]) {
    if (!packageJson.workspaces?.includes(workspace)) {
      findings.push(
        finding(
          `The root package must include the ${workspace} workspace.`,
          "package.json",
          `Add ${JSON.stringify(workspace)} to package.json#workspaces.`,
        ),
      );
    }
  }

  return findings;
};

const validateScripts = (
  scripts: Readonly<Record<string, string>>,
  required: Readonly<Record<string, string>>,
  file: string,
): Finding[] => {
  const findings: Finding[] = [];

  for (const [script, command] of Object.entries(required)) {
    if (scripts[script] !== command) {
      findings.push(
        finding(
          `The ${script} script does not match the tooling contract.`,
          file,
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
          file,
          "Use Bun for package scripts and one-off executables.",
        ),
      );
    }
  }

  return findings;
};

const validateDependencies = (
  dependencies: Readonly<Record<string, string>> | undefined,
  required: readonly string[],
  file: string,
  group: string,
): Finding[] => {
  const findings: Finding[] = [];

  for (const dependency of required) {
    if (!dependencies?.[dependency]) {
      findings.push(
        finding(`Missing ${group}: ${dependency}.`, file, `Declare ${dependency} in ${file}.`),
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
    await mkdir(join(context.root, ".zed"), {
      recursive: true,
    });
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
    docs: "Keep the Bun workspaces, quality gate, and Zed tasks on one exact contract.",
    fixable: true,
    id: ruleId,
    kind: "project",
  },
  async run(context) {
    const rootPackageJson = (await context.packageJson(".")) as PackageJson;
    const webPackageJson = (await context.packageJson("apps/web")) as PackageJson;
    const rootScripts = rootPackageJson.scripts ?? {};
    const webScripts = webPackageJson.scripts ?? {};
    const files = new Set(
      await context.glob([
        ...requiredFiles,
        ".zed/tasks.json",
      ]),
    );
    const findings = [
      ...validateRootPackage(rootPackageJson),
      ...validateScripts(rootScripts, requiredScripts, "package.json"),
      ...validateScripts(webScripts, requiredWebScripts, "apps/web/package.json"),
      ...validateDependencies(
        rootPackageJson.devDependencies,
        requiredRootDevelopmentDependencies,
        "package.json",
        "root development dependency",
      ),
      ...validateDependencies(
        webPackageJson.dependencies,
        requiredWebRuntimeDependencies,
        "apps/web/package.json",
        "web runtime dependency",
      ),
      ...validateDependencies(
        webPackageJson.devDependencies,
        requiredWebDevelopmentDependencies,
        "apps/web/package.json",
        "web development dependency",
      ),
      ...validateFiles(files),
      ...(await validateZedTasks(context, rootScripts, files)),
    ];

    return {
      findings,
    };
  },
};

export { requiredScripts, toolingContract };

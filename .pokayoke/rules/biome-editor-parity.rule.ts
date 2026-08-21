// biome-ignore-all lint/style/useNamingConvention: Zed's public settings schema uses snake_case keys.
import type { Finding, Rule } from "pokayoke";

interface PackageJson {
  readonly scripts?: Readonly<Record<string, string>>;
}

interface LanguageSettings {
  readonly code_actions_on_format?: Readonly<Record<string, boolean>>;
  readonly format_on_save?: string;
  readonly formatter?: {
    readonly language_server?: {
      readonly name?: string;
    };
  };
}

interface ZedSettings {
  readonly ensure_final_newline_on_save?: boolean;
  readonly format_on_save?: string;
  readonly languages?: Readonly<Record<string, LanguageSettings>>;
  readonly line_ending?: string;
  readonly lsp?: {
    readonly biome?: {
      readonly settings?: {
        readonly require_config_file?: boolean;
      };
    };
  };
}

const ruleId = "repo/biome-editor-parity";
const settingsPath = ".zed/settings.json";
const javascriptLanguages = [
  "JavaScript",
  "JSX",
  "TypeScript",
  "TSX",
] as const;
const biomeLanguages = [
  ...javascriptLanguages,
  "JSON",
  "JSONC",
  "CSS",
  "HTML",
] as const;

const finding = (message: string, advice: string, file = settingsPath): Finding => ({
  advice,
  file,
  message,
  ruleId,
  severity: "error",
});

const validateGlobalSettings = (settings: ZedSettings): Finding[] => {
  const findings: Finding[] = [];

  if (settings.format_on_save !== "on") {
    findings.push(finding("Zed must format on save.", 'Set "format_on_save" to "on".'));
  }

  if (settings.ensure_final_newline_on_save !== true) {
    findings.push(
      finding(
        "Zed must preserve the repository's final-newline contract.",
        'Set "ensure_final_newline_on_save" to true.',
      ),
    );
  }

  if (settings.line_ending !== "prefer_lf") {
    findings.push(
      finding(
        "Zed must preserve the repository's LF contract.",
        'Set "line_ending" to "prefer_lf".',
      ),
    );
  }

  if (settings.lsp?.biome?.settings?.require_config_file !== true) {
    findings.push(
      finding(
        "Zed's Biome server must require the repository config.",
        "Set lsp.biome.settings.require_config_file to true.",
      ),
    );
  }

  return findings;
};

const validateLanguages = (settings: ZedSettings): Finding[] => {
  const findings: Finding[] = [];

  for (const languageName of biomeLanguages) {
    const language = settings.languages?.[languageName];

    if (
      language?.format_on_save !== "on" ||
      language.formatter?.language_server?.name !== "biome"
    ) {
      findings.push(
        finding(
          `${languageName} must use Biome as its save formatter.`,
          `Configure languages.${languageName} with format_on_save "on" and the named Biome formatter.`,
        ),
      );
    }

    if (language?.code_actions_on_format?.["source.fixAll.biome"] !== true) {
      findings.push(
        finding(
          `${languageName} must apply Biome's safe fixes on save.`,
          `Enable source.fixAll.biome for languages.${languageName}.`,
        ),
      );
    }
  }

  for (const languageName of javascriptLanguages) {
    if (
      settings.languages?.[languageName]?.code_actions_on_format?.[
        "source.organizeImports.biome"
      ] !== true
    ) {
      findings.push(
        finding(
          `${languageName} must organize imports with Biome on save.`,
          `Enable source.organizeImports.biome for languages.${languageName}.`,
        ),
      );
    }
  }

  return findings;
};

const validateScripts = (packageJson: PackageJson): Finding[] => {
  const scripts = packageJson.scripts ?? {};
  const findings: Finding[] = [];

  if (scripts["check:biome"] !== "bun packages/scripts/src/check-biome.ts") {
    findings.push(
      finding(
        "The Bun Biome check must fail on every diagnostic visible in Zed.",
        'Set scripts.check:biome to "bun packages/scripts/src/check-biome.ts".',
        "package.json",
      ),
    );
  }

  if (
    scripts["check:biome:fix"] !==
    "biome check --write --diagnostic-level=info --max-diagnostics=none ."
  ) {
    findings.push(
      finding(
        "The default Bun fix script must match Zed's safe save actions.",
        "Include info-level diagnostics and remove the diagnostic cap from check:biome:fix.",
        "package.json",
      ),
    );
  }

  if (
    scripts["check:biome:fix:unsafe"] !==
    "biome check --write --unsafe --diagnostic-level=info --max-diagnostics=none ."
  ) {
    findings.push(
      finding(
        "The explicit unsafe Biome script is missing.",
        "Include info-level diagnostics and remove the diagnostic cap from check:biome:fix:unsafe.",
        "package.json",
      ),
    );
  }

  return findings;
};

const biomeEditorParity: Rule = {
  meta: {
    docs: "Keep Zed's Biome save actions aligned with the repository's safe Bun fix script.",
    fixable: false,
    id: ruleId,
    kind: "project",
  },
  async run(context) {
    const files = new Set(
      await context.glob([
        settingsPath,
      ]),
    );

    if (!files.has(settingsPath)) {
      return {
        findings: [
          finding("Zed's Biome settings are missing.", `Restore ${settingsPath}.`),
        ],
      };
    }

    let settings: ZedSettings;

    try {
      settings = JSON.parse(await context.readFile(settingsPath)) as ZedSettings;
    } catch (error) {
      let detail = "";

      if (error instanceof Error) {
        detail = ` ${error.message}`;
      }

      return {
        findings: [
          finding(`Zed's Biome settings are not valid JSON.${detail}`, `Repair ${settingsPath}.`),
        ],
      };
    }

    const packageJson = (await context.packageJson(".")) as PackageJson;

    return {
      findings: [
        ...validateGlobalSettings(settings),
        ...validateLanguages(settings),
        ...validateScripts(packageJson),
      ],
    };
  },
};

export { biomeEditorParity };

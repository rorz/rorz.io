// biome-ignore-all lint/style/useNamingConvention: The fixture mirrors Zed's public settings schema.
import { describe, expect, test } from "bun:test";
import type { RuleContext } from "pokayoke";
import { biomeEditorParity } from "./biome-editor-parity.rule.ts";

const codeActions = {
  "source.fixAll.biome": true,
  "source.organizeImports.biome": true,
} as const;

const settings = {
  ensure_final_newline_on_save: true,
  format_on_save: "on",
  languages: {
    CSS: {
      code_actions_on_format: {
        "source.fixAll.biome": true,
      },
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    HTML: {
      code_actions_on_format: {
        "source.fixAll.biome": true,
      },
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    JavaScript: {
      code_actions_on_format: codeActions,
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    JSON: {
      code_actions_on_format: {
        "source.fixAll.biome": true,
      },
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    JSONC: {
      code_actions_on_format: {
        "source.fixAll.biome": true,
      },
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    JSX: {
      code_actions_on_format: codeActions,
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    TSX: {
      code_actions_on_format: codeActions,
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
    TypeScript: {
      code_actions_on_format: codeActions,
      format_on_save: "on",
      formatter: {
        language_server: {
          name: "biome",
        },
      },
    },
  },
  line_ending: "prefer_lf",
  lsp: {
    biome: {
      settings: {
        require_config_file: true,
      },
    },
  },
} as const;

const scripts = {
  "check:biome:fix": "biome check --write .",
  "check:biome:fix:unsafe": "biome check --write --unsafe .",
} as const;

const createContext = (
  zedSettings: object = settings,
  packageScripts: Readonly<Record<string, string>> = scripts,
): RuleContext => ({
  files: async () => [],
  fix: false,
  glob: async () => [
    ".zed/settings.json",
  ],
  options: undefined,
  packageJson: async () => ({
    scripts: packageScripts,
  }),
  parseTypescript: () => Promise.reject(new Error("parseTypescript is not used by this rule.")),
  readFile: async () => JSON.stringify(zedSettings),
  report: () => undefined,
  root: "/repo",
  workspaces: async () => [],
});

describe("repo/biome-editor-parity", () => {
  test("accepts matching Zed save actions and Bun scripts", async () => {
    const result = await biomeEditorParity.run(createContext());

    expect(result.findings).toHaveLength(0);
  });

  test("reports editor and script drift", async () => {
    const driftedSettings = {
      ...settings,
      languages: {
        ...settings.languages,
        TypeScript: {
          ...settings.languages.TypeScript,
          formatter: {
            language_server: {
              name: "vtsls",
            },
          },
        },
      },
    };
    const result = await biomeEditorParity.run(
      createContext(driftedSettings, {
        ...scripts,
        "check:biome:fix": "biome check --write --unsafe .",
      }),
    );

    expect(result.findings).toHaveLength(2);
    expect(result.findings.map(({ file }) => file)).toEqual([
      ".zed/settings.json",
      "package.json",
    ]);
  });
});

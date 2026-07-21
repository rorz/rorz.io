import { parse } from "yaml";
import type { VaultFrontmatter } from "./types.ts";

interface ParsedVaultSource {
  readonly body: string;
  readonly frontmatter: VaultFrontmatter;
}

const frontmatterPattern =
  /^(?:\uFEFF)?---[^\S\r\n]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[^\S\r\n]*(?:\r?\n|$)/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseVaultSource = (source: string, path: string): ParsedVaultSource => {
  const match = frontmatterPattern.exec(source);

  if (!match) {
    return {
      body: source,
      frontmatter: {},
    };
  }

  let parsed: unknown;

  try {
    parsed = parse(match[1] ?? "");
  } catch (error) {
    throw new Error(`Invalid frontmatter in ${path}`, {
      cause: error,
    });
  }

  if (parsed !== null && !isRecord(parsed)) {
    throw new Error(`Frontmatter in ${path} must be a YAML object`);
  }

  return {
    body: source.slice(match[0].length),
    frontmatter: parsed ?? {},
  };
};

export { parseVaultSource };

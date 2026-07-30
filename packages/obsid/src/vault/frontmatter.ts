import { parse as parseYaml } from "yaml";
import { z } from "zod";
import {
  getNoteDefinition,
  type ObsidNoteForSchema,
  type ObsidSchemaShape,
} from "../config/schema.ts";
import type { ObsidianParsedProperties, ObsidianPropertyMap } from "../types/frontmatter.ts";

type ParsedVaultSource<Schema extends ObsidSchemaShape> = ObsidNoteForSchema<Schema> & {
  readonly body: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
};

const frontmatterPattern =
  /^(?:\uFEFF)?---[^\S\r\n]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[^\S\r\n]*(?:\r?\n|$)/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRawFrontmatter = (
  source: string,
  path: string,
): {
  readonly body: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
} => {
  const match = frontmatterPattern.exec(source);

  if (!match) {
    return {
      body: source,
      frontmatter: {},
    };
  }

  let parsedFrontmatter: unknown;

  try {
    parsedFrontmatter = parseYaml(match[1] ?? "");
  } catch (error) {
    throw new Error(`Invalid frontmatter in ${path}.md`, {
      cause: error,
    });
  }

  if (parsedFrontmatter !== null && !isRecord(parsedFrontmatter)) {
    throw new Error(`Frontmatter in ${path}.md must be a YAML object`);
  }

  return {
    body: source.slice(match[0].length),
    frontmatter: parsedFrontmatter ?? {},
  };
};

const parseProperties = <PropertyMap extends ObsidianPropertyMap>(
  frontmatter: Readonly<Record<string, unknown>>,
  propertyMap: PropertyMap,
  path: string,
): ObsidianParsedProperties<PropertyMap> => {
  const result = z.object(propertyMap).safeParse(frontmatter);

  if (!result.success) {
    throw new Error(`Invalid frontmatter in ${path}.md\n${z.prettifyError(result.error)}`, {
      cause: result.error,
    });
  }

  return result.data as ObsidianParsedProperties<PropertyMap>;
};

const parseVaultSource = <Schema extends ObsidSchemaShape>(
  source: string,
  path: string,
  schema: Schema,
): ParsedVaultSource<Schema> => {
  const { body, frontmatter } = parseRawFrontmatter(source, path);
  let kind: unknown = schema.default.name;

  if (schema.discriminator && Object.hasOwn(frontmatter, schema.discriminator)) {
    kind = frontmatter[schema.discriminator];
  }

  if (typeof kind !== "string") {
    throw new Error(
      `Note kind property "${schema.discriminator ?? ""}" in ${path}.md must be text`,
    );
  }

  const definition = getNoteDefinition(schema, kind);

  if (!definition) {
    throw new Error(`Unknown note kind "${kind}" in ${path}.md`);
  }

  return {
    body,
    data: parseProperties(frontmatter, definition.properties, path),
    frontmatter,
    kind,
  } as ParsedVaultSource<Schema>;
};

export { parseVaultSource };

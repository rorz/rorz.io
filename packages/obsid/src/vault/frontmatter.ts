import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { ObsidPageForSchema, ObsidSchemaShape } from "../config/schema.ts";
import type { ObsidianParsedProperties, ObsidianPropertyMap } from "../types/frontmatter.ts";

type ParsedVaultSource<Schema extends ObsidSchemaShape> = ObsidPageForSchema<Schema> & {
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
  let pageType: unknown = schema.defaultType;

  if (schema.typeIdentifier && Object.hasOwn(frontmatter, schema.typeIdentifier)) {
    pageType = frontmatter[schema.typeIdentifier];
  }

  if (typeof pageType !== "string") {
    throw new Error(
      `Page type property "${schema.typeIdentifier ?? ""}" in ${path}.md must be text`,
    );
  }

  const definition = schema.registry[pageType];

  if (!definition) {
    throw new Error(`Unknown page type "${pageType}" in ${path}.md`);
  }

  return {
    body,
    frontmatter,
    pageType,
    properties: parseProperties(frontmatter, definition.properties, path),
  } as ParsedVaultSource<Schema>;
};

export { parseVaultSource };

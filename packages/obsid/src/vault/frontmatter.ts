import { parse as parseYaml } from "yaml";
import z from "zod";
import type {
  ObsidianParsedProperties,
  ObsidianPropertyMap,
  ObsidianPropertyType,
  ObsidianPropertyValueMap,
} from "../types/frontmatter.ts";

interface ParsedVaultSource<M extends ObsidianPropertyMap> {
  readonly body: string;
  readonly properties: ObsidianParsedProperties<M>;
}

const frontmatterPattern =
  /^(?:\uFEFF)?---[^\S\r\n]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[^\S\r\n]*(?:\r?\n|$)/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type PropertyParsers = {
  [P in ObsidianPropertyType]: (value: unknown) => ObsidianPropertyValueMap[P];
};

const propertyParsers: PropertyParsers = {
  checkbox: (value) => z.boolean().parse(value),
  date: (value) => {
    const stringRepresentation = z.iso.date().parse(value);
    return new Date(stringRepresentation);
  },
  "date-and-time": (value) => {
    const stringRepresentation = z.iso.datetime().parse(value);
    return new Date(stringRepresentation);
  },
  list: (value) => [
    {
      type: "string",
      value: "STUB",
    },
  ],
  number: (value) => z.number().parse(value),
  text: (value) => ({
    type: "string",
    value: "STUB",
  }),
};

const parseProperty = <P extends ObsidianPropertyType>(
  propertyType: P,
  value: unknown,
): ObsidianPropertyValueMap[P] => propertyParsers[propertyType](value);

export const parseVaultSource = <Pm extends ObsidianPropertyMap>(
  source: string,
  path: string,
  propertyMap: Pm,
): ParsedVaultSource<Pm> => {
  const frontMatterMatches = frontmatterPattern.exec(source);
  const frontMatterBlock = frontMatterMatches?.[0];
  const frontMatterRawYaml = frontMatterMatches?.[1];
  const noMatches = frontMatterBlock === undefined || frontMatterRawYaml === undefined;
  const propertyMapEmpty = Object.keys(propertyMap).length === 0;

  if (noMatches) {
    if (propertyMapEmpty) {
      return {
        body: source,
        properties: {} as ObsidianParsedProperties<Pm>,
      };
    }

    throw new Error(`No frontmatter could be found for vault file at ${path}`);
  }

  let parsedFrontmatter: unknown;

  try {
    parsedFrontmatter = parseYaml(frontMatterRawYaml);
  } catch (error) {
    throw new Error(`Invalid frontmatter in ${path}`, {
      cause: error,
    });
  }

  if (parsedFrontmatter === null || !isRecord(parsedFrontmatter)) {
    throw new Error(`Frontmatter in ${path} must be a YAML object`);
  }

  const properties: ObsidianParsedProperties<Pm> = Object.entries(parsedFrontmatter).reduce(
    (output, [key, value]) => {
      const propertyType = propertyMap[key];
      if (propertyType === undefined) {
        throw new Error("Property type in frontmatter is undefined");
      }
      const propertyValue = parseProperty(propertyType, value);
      return Object.assign(output, {
        [key]: propertyValue,
      });
    },
    {} as ObsidianParsedProperties<Pm>,
  );

  return {
    body: source.slice(frontMatterBlock.length),
    properties,
  };
};

import type { ReactNode } from "react";
import type {
  ObsidianNotePropertyValue,
  ObsidianParsedProperties,
  ObsidianPropertyMap,
} from "../types/frontmatter.ts";
import type { ObsidFolderReference } from "../types/reference.ts";

type ObsidPageForPropertyMaps<PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>> =
  {
    [PageType in keyof PropertyMaps & string]: {
      readonly pageType: PageType;
      readonly properties: ObsidianParsedProperties<PropertyMaps[PageType]>;
    };
  }[keyof PropertyMaps & string];

type ObsidResolveNote<PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>> = (
  reference: ObsidianNotePropertyValue,
) => Promise<ObsidResolvedNote<PropertyMaps> | null>;

type ObsidResolveFolder<PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>> = (
  reference: ObsidFolderReference,
) => Promise<readonly ObsidResolvedNote<PropertyMaps>[]>;

type ObsidResolvedNote<PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>> =
  ObsidPageForPropertyMaps<PropertyMaps> & {
    readonly body: string;
    readonly currentFolder: ObsidFolderReference;
    readonly path: string;
    readonly resolveFolder: ObsidResolveFolder<PropertyMaps>;
    readonly resolveNote: ObsidResolveNote<PropertyMaps>;
  };

type ObsidRendererTools<PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>> = {
  readonly currentFolder: ObsidFolderReference;
  readonly markdown: string;
  readonly resolveFolder: ObsidResolveFolder<PropertyMaps>;
  readonly resolveNote: ObsidResolveNote<PropertyMaps>;
};

type ObsidPageDefinition<
  PropertyMap extends ObsidianPropertyMap,
  PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>,
> = {
  readonly properties: PropertyMap;
  readonly renderer: (
    properties: ObsidianParsedProperties<PropertyMap>,
    tools: ObsidRendererTools<PropertyMaps>,
  ) => ReactNode;
};

type ObsidSchema<PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>> = {
  readonly defaultType: keyof PropertyMaps & string;
  readonly registry: {
    readonly [Name in keyof PropertyMaps]: ObsidPageDefinition<PropertyMaps[Name], PropertyMaps>;
  };
  readonly typeIdentifier?: string;
};

type ObsidSchemaShape = {
  readonly defaultType: string;
  readonly registry: Readonly<
    Record<
      string,
      {
        readonly properties: ObsidianPropertyMap;
        readonly renderer: (...args: never[]) => ReactNode;
      }
    >
  >;
  readonly typeIdentifier?: string;
};

type PropertyMapsForSchema<Schema extends ObsidSchemaShape> = {
  readonly [PageType in keyof Schema["registry"]]: Schema["registry"][PageType]["properties"];
};

type ObsidPageForSchema<Schema extends ObsidSchemaShape> = ObsidPageForPropertyMaps<
  PropertyMapsForSchema<Schema>
>;

type ObsidResolvedNoteForSchema<Schema extends ObsidSchemaShape> = ObsidResolvedNote<
  PropertyMapsForSchema<Schema>
>;

type ObsidRendererToolsForSchema<Schema extends ObsidSchemaShape> = ObsidRendererTools<
  PropertyMapsForSchema<Schema>
>;

type ObsidResolveFolderForSchema<Schema extends ObsidSchemaShape> = ObsidResolveFolder<
  PropertyMapsForSchema<Schema>
>;

type ObsidResolveNoteForSchema<Schema extends ObsidSchemaShape> = ObsidResolveNote<
  PropertyMapsForSchema<Schema>
>;

const defineObsidSchema = <
  const PropertyMaps extends Readonly<Record<string, ObsidianPropertyMap>>,
>(
  schema: ObsidSchema<PropertyMaps>,
): ObsidSchema<PropertyMaps> => schema;

const renderObsidPage = <Schema extends ObsidSchemaShape>(
  schema: Schema,
  page: ObsidResolvedNoteForSchema<Schema>,
): ReactNode => {
  const definition = schema.registry[page.pageType];

  if (!definition) {
    throw new Error(`Unknown page type: ${page.pageType}`);
  }

  const renderer = definition.renderer as unknown as (
    properties: ObsidPageForSchema<Schema>["properties"],
    tools: ObsidRendererToolsForSchema<Schema>,
  ) => ReactNode;

  return renderer(page.properties, {
    currentFolder: page.currentFolder,
    markdown: page.body,
    resolveFolder: page.resolveFolder,
    resolveNote: page.resolveNote,
  });
};

export type {
  ObsidPageDefinition,
  ObsidPageForSchema,
  ObsidRendererToolsForSchema,
  ObsidResolvedNoteForSchema,
  ObsidResolveFolderForSchema,
  ObsidResolveNoteForSchema,
  ObsidSchema,
  ObsidSchemaShape,
};
export { defineObsidSchema, renderObsidPage };

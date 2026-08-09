import type { ReactNode } from "react";
import type {
  ObsidianNotePropertyValue,
  ObsidianParsedProperties,
  ObsidianPropertyMap,
} from "../types/frontmatter.ts";
import type { ObsidFolderReference } from "../types/reference.ts";
import type { ObsidRouting } from "./routing.ts";
import type { ObsidOrderExpression } from "./sort.ts";

interface ObsidNoteDefinition<Name extends string, PropertyMap extends ObsidianPropertyMap> {
  readonly name: Name;
  readonly properties: PropertyMap;
}

interface ObsidNoteDefinitionShape {
  readonly name: string;
  readonly properties: ObsidianPropertyMap;
}

type ObsidNoteDefinitions = readonly ObsidNoteDefinitionShape[];

type ObsidNoteForDefinition<Definition extends ObsidNoteDefinitionShape> =
  Definition extends ObsidNoteDefinition<infer Name, infer PropertyMap>
    ? {
        readonly kind: Name;
        readonly properties: ObsidianParsedProperties<PropertyMap>;
      }
    : never;

type ObsidNoteForDefinitions<Definitions extends ObsidNoteDefinitions> = ObsidNoteForDefinition<
  Definitions[number]
>;

type ObsidNoteKind<Definitions extends ObsidNoteDefinitions> =
  ObsidNoteForDefinitions<Definitions>["kind"];

type ObsidResolveImage = (target: string) => string | null;

type ObsidResolvedNoteForKind<
  Definitions extends ObsidNoteDefinitions,
  Kind extends ObsidNoteKind<Definitions>,
> = Extract<
  ObsidResolvedNote<Definitions>,
  {
    readonly kind: Kind;
  }
>;

interface ObsidFindManyOptions<
  Definitions extends ObsidNoteDefinitions,
  Note extends ObsidResolvedNote<Definitions>,
> {
  readonly folder: ObsidFolderReference;
  readonly kind?: ObsidNoteKind<Definitions> | undefined;
  readonly limit?: number | undefined;
  readonly orderBy?: ((note: Note) => ObsidOrderExpression) | undefined;
}

interface ObsidFindMany<Definitions extends ObsidNoteDefinitions> {
  <const Kind extends ObsidNoteKind<Definitions>>(
    options: ObsidFindManyOptions<Definitions, ObsidResolvedNoteForKind<Definitions, Kind>> & {
      readonly kind: Kind;
    },
  ): Promise<readonly ObsidResolvedNoteForKind<Definitions, Kind>[]>;
  (
    options: ObsidFindManyOptions<Definitions, ObsidResolvedNote<Definitions>>,
  ): Promise<readonly ObsidResolvedNote<Definitions>[]>;
}

interface ObsidQuery<Definitions extends ObsidNoteDefinitions> {
  readonly findMany: ObsidFindMany<Definitions>;
  readonly resolve: (
    reference: ObsidianNotePropertyValue,
  ) => Promise<ObsidResolvedNote<Definitions> | null>;
  readonly resolveOrThrow: (
    reference: ObsidianNotePropertyValue,
  ) => Promise<ObsidResolvedNote<Definitions>>;
}

type ObsidResolvedNote<Definitions extends ObsidNoteDefinitions> =
  ObsidNoteForDefinitions<Definitions> & {
    readonly body: string;
    readonly folder: ObsidFolderReference;
    readonly query: ObsidQuery<Definitions>;
    readonly resolveImage: ObsidResolveImage;
    readonly name: string;
    readonly vaultPath: string;
    readonly webPath: string;
  };

interface ObsidRenderContext<
  Definitions extends ObsidNoteDefinitions,
  Kind extends ObsidNoteKind<Definitions>,
> {
  readonly note: ObsidResolvedNoteForKind<Definitions, Kind>;
  readonly query: ObsidQuery<Definitions>;
}

type ObsidRenderers<Definitions extends ObsidNoteDefinitions> = {
  readonly [Kind in ObsidNoteKind<Definitions>]: (
    context: ObsidRenderContext<Definitions, Kind>,
  ) => ReactNode;
};

interface ObsidSchemaShape {
  readonly default: ObsidNoteDefinitionShape;
  readonly discriminator: string | undefined;
  readonly notes: ObsidNoteDefinitions;
  readonly routing: ObsidRouting | undefined;
}

interface ObsidRenderedSchemaShape extends ObsidSchemaShape {
  readonly renderers: Readonly<Record<string, (context: never) => ReactNode>>;
}

type ObsidSchemaModel<Definitions extends ObsidNoteDefinitions> = {
  readonly default: Definitions[number];
  readonly discriminator: string | undefined;
  readonly notes: Definitions;
  readonly render: (renderers: ObsidRenderers<Definitions>) => ObsidRenderedSchema<Definitions>;
  readonly routing: ObsidRouting | undefined;
};

type ObsidRenderedSchema<Definitions extends ObsidNoteDefinitions> =
  ObsidSchemaModel<Definitions> & {
    readonly renderers: ObsidRenderers<Definitions>;
  };

type DefinitionsForSchema<Schema extends ObsidSchemaShape> = Schema["notes"];

type ObsidNoteForSchema<Schema extends ObsidSchemaShape> = ObsidNoteForDefinitions<
  DefinitionsForSchema<Schema>
>;

type ObsidResolvedNoteForSchema<Schema extends ObsidSchemaShape> = ObsidResolvedNote<
  DefinitionsForSchema<Schema>
>;

type ObsidQueryForSchema<Schema extends ObsidSchemaShape> = ObsidQuery<
  DefinitionsForSchema<Schema>
>;

const note = <const Name extends string, const PropertyMap extends ObsidianPropertyMap>(
  name: Name,
  properties: PropertyMap,
): ObsidNoteDefinition<Name, PropertyMap> => ({
  name,
  properties,
});

const defineSchema = <
  const Definitions extends readonly [
    ObsidNoteDefinitionShape,
    ...ObsidNoteDefinitionShape[],
  ],
>(input: {
  readonly default: Definitions[number];
  readonly discriminator?: string;
  readonly notes: Definitions;
  readonly routing?: ObsidRouting;
}): ObsidSchemaModel<Definitions> => {
  const names = input.notes.map((definition) => definition.name);

  if (new Set(names).size !== names.length) {
    throw new Error("Schema note names must be unique");
  }

  if (!input.notes.includes(input.default)) {
    throw new Error(`Default note kind "${input.default.name}" is not registered`);
  }

  const render: ObsidSchemaModel<Definitions>["render"] = (renderers) => ({
    ...model,
    renderers,
  });
  const model: ObsidSchemaModel<Definitions> = {
    default: input.default,
    discriminator: input.discriminator,
    notes: input.notes,
    render,
    routing: input.routing,
  };

  return model;
};

const getNoteDefinition = <Schema extends ObsidSchemaShape>(
  schema: Schema,
  kind: string,
): Schema["notes"][number] | null =>
  schema.notes.find((definition) => definition.name === kind) ?? null;

const renderObsidPage = <Schema extends ObsidRenderedSchemaShape>(
  schema: Schema,
  page: ObsidResolvedNoteForSchema<Schema>,
): ReactNode => {
  const renderer = schema.renderers[page.kind];

  if (!renderer) {
    throw new Error(`Missing renderer for note kind: ${page.kind}`);
  }

  return renderer({
    note: page,
    query: page.query,
  } as never);
};

// biome-ignore lint/performance/noBarrelFile: This module is the package's intentional schema entry point.
export { p } from "../property/index.ts";
export type {
  ObsidPermalink,
  ObsidPermalinkContext,
  ObsidRouting,
  ObsidSlugify,
} from "./routing.ts";
export { defaultPermalink, getWebPath, slugify } from "./routing.ts";
export type {
  ObsidOrderDirection,
  ObsidOrderExpression,
  SortablePropertyKey,
  SortablePropertyValue,
} from "./sort.ts";
export { asc, desc, sortBy } from "./sort.ts";
export type {
  DefinitionsForSchema,
  ObsidFindMany,
  ObsidFindManyOptions,
  ObsidNoteDefinition,
  ObsidNoteDefinitionShape,
  ObsidNoteDefinitions,
  ObsidNoteForSchema,
  ObsidNoteKind,
  ObsidQuery,
  ObsidQueryForSchema,
  ObsidRenderedSchema,
  ObsidRenderedSchemaShape,
  ObsidRenderers,
  ObsidResolvedNote,
  ObsidResolvedNoteForKind,
  ObsidResolvedNoteForSchema,
  ObsidResolveImage,
  ObsidSchemaModel,
  ObsidSchemaShape,
};
export { defineSchema, getNoteDefinition, note, renderObsidPage };

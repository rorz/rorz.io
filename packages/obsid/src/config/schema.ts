import type { ReactNode } from "react";
import type { ObsidianParsedProperties, ObsidianPropertyMap } from "../types/frontmatter.ts";

type ObsidPageDefinition<P extends ObsidianPropertyMap> = {
  properties: P;
  renderer: (properties: ObsidianParsedProperties<P>) => ReactNode;
};

type ObsidSchema<PropertyMaps extends Record<string, ObsidianPropertyMap>> = {
  typeIdentifier?: string;
  registry: {
    [Name in keyof PropertyMaps]: ObsidPageDefinition<PropertyMaps[Name]>;
  };
};

const defineObsidSchema = <const PropertyMaps extends Record<string, ObsidianPropertyMap>>(
  schema: ObsidSchema<PropertyMaps>,
): ObsidSchema<PropertyMaps> => schema;

const exampleSchema = defineObsidSchema({
  registry: {
    jerry_page: {
      properties: {
        date: "date",
        title: "text",
      },
      renderer: ({ title, date }) => `${title} ${date}`,
    },
  },
  typeIdentifier: "type",
});

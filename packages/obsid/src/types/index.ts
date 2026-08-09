export type {
  ObsidianNotePropertyValue,
  ObsidianParsedProperties,
  ObsidianPropertyMap,
  ObsidianPropertyType,
  ObsidianPropertyValueMap,
  StringPropertyValue,
} from "./frontmatter.ts";
// biome-ignore lint/performance/noBarrelFile: This is the package's intentional public types entry point.
export {
  StringPropertyFileTypeSchema,
  StringPropertyLinkTypeSchema,
  StringPropertyNoteTypeSchema,
  StringPropertyStringTypeSchema,
} from "./frontmatter.ts";
export type { ObsidFolderReference } from "./reference.ts";

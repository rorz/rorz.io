export type { GetFile } from "./file-store.ts";
// biome-ignore lint/performance/noBarrelFile: This is the package's intentional public entry point.
export { getFile } from "./get-file.ts";
export type {
  ObsidianContentProps,
  ObsidianFile,
  ResolveWikiLink,
} from "./markdown.tsx";

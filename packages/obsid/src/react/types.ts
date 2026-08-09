import type { Components } from "react-markdown";
import type { ObsidRenderedSchemaShape, ObsidResolvedNoteForSchema } from "../config/schema.ts";
import type { VaultLink } from "../vault/types.ts";

type ResolveWikiLink = (link: VaultLink) => string;
type ResolveWikiImage = (target: string) => string | null;

interface ObsidianMarkdownProps {
  readonly children: string;
  readonly components?: Components;
  readonly links?: readonly VaultLink[];
  readonly resolveWikiImage?: ResolveWikiImage;
  readonly resolveWikiLink?: ResolveWikiLink;
}

interface ObsidProps<Schema extends ObsidRenderedSchemaShape> {
  readonly note: ObsidResolvedNoteForSchema<Schema>;
  readonly schema: Schema;
}

export type { ObsidianMarkdownProps, ObsidProps, ResolveWikiImage, ResolveWikiLink };

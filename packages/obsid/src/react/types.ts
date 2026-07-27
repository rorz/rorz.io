import type { Components } from "react-markdown";
import type { ObsidResolvedNoteForSchema, ObsidSchemaShape } from "../config/schema.ts";
import type { VaultLink } from "../vault/types.ts";

type ResolveWikiLink = (link: VaultLink) => string;

interface ObsidianMarkdownProps {
  readonly children: string;
  readonly components?: Components;
  readonly links?: readonly VaultLink[];
  readonly resolveWikiLink?: ResolveWikiLink;
}

interface ObsidProps<Schema extends ObsidSchemaShape> {
  readonly note: ObsidResolvedNoteForSchema<Schema>;
  readonly schema: Schema;
}

export type { ObsidianMarkdownProps, ObsidProps, ResolveWikiLink };

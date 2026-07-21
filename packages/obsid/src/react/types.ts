import type { Components } from "react-markdown";
import type { VaultFile, VaultLink } from "../vault/types.ts";

type ResolveWikiLink = (link: VaultLink) => string;

interface ObsidianMarkdownProps {
  readonly components?: Components;
  readonly file: Pick<VaultFile, "body" | "links">;
  readonly resolveWikiLink?: ResolveWikiLink;
}

export type { ObsidianMarkdownProps, ResolveWikiLink };

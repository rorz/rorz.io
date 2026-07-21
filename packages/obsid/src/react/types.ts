import type { Components } from "react-markdown";
import type { VaultFile } from "../vault/file-store.ts";

type ResolveWikiLink = (target: string) => string;

interface ObsidianMarkdownProps {
  readonly components?: Components;
  readonly file: Pick<VaultFile, "source">;
  readonly resolveWikiLink?: ResolveWikiLink;
}

export type { ObsidianMarkdownProps, ResolveWikiLink };

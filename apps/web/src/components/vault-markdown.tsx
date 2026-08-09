import { ObsidianMarkdown } from "obsid/react";
import type { VaultFile } from "obsid/vault";
import { MarkdownImage } from "@/components/markdown-image.tsx";

interface VaultMarkdownProps {
  readonly note: Pick<VaultFile, "body" | "resolveImage">;
}

const markdownComponents = {
  img: MarkdownImage,
};

const VaultMarkdown = ({ note }: VaultMarkdownProps) => (
  <ObsidianMarkdown components={markdownComponents} resolveWikiImage={note.resolveImage}>
    {note.body}
  </ObsidianMarkdown>
);

export { VaultMarkdown };

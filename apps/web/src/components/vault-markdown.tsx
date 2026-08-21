import { ObsidianMarkdown } from "obsid/react";
import type { VaultFile } from "obsid/vault";
import type { ComponentProps } from "react";
import { ExternalLink, InternalLink } from "@/components/content-link.tsx";
import { MarkdownBlockquote } from "@/components/markdown-blockquote.tsx";
import { MarkdownHorizontalRule } from "@/components/markdown-horizontal-rule.tsx";
import { MarkdownImage } from "@/components/markdown-image.tsx";
import { cn } from "@/lib/cn/index.ts";

interface VaultMarkdownProps {
  readonly note: Pick<VaultFile, "body" | "resolveImage">;
}

type MarkdownLinkProps = ComponentProps<"a"> & {
  readonly node?: unknown;
};

const externalLinkPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu;

const MarkdownLink = ({ children, className, href = "", node: _node }: MarkdownLinkProps) => {
  if (externalLinkPattern.test(href)) {
    return (
      <ExternalLink className={cn(className, "gap-0.5")} href={href}>
        {children}
      </ExternalLink>
    );
  }

  return (
    <InternalLink className={className} href={href}>
      {children}
    </InternalLink>
  );
};

const markdownComponents = {
  a: MarkdownLink,
  blockquote: MarkdownBlockquote,
  hr: MarkdownHorizontalRule,
  img: MarkdownImage,
};

const VaultMarkdown = ({ note }: VaultMarkdownProps) => (
  <div className="markdown flex w-full flex-col items-start gap-2">
    <ObsidianMarkdown components={markdownComponents} resolveWikiImage={note.resolveImage}>
      {note.body}
    </ObsidianMarkdown>
  </div>
);

export { VaultMarkdown };

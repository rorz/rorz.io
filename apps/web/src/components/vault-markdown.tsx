import { ObsidianMarkdown, type ObsidianMarkdownProps } from "obsid/react";
import type { VaultFile } from "obsid/vault";
import type { ComponentProps, ReactNode } from "react";
import { ExternalLink, InternalLink } from "@/components/content-link.tsx";
import { MarkdownBlockquote } from "@/components/markdown-blockquote.tsx";
import { MarkdownHorizontalRule } from "@/components/markdown-horizontal-rule.tsx";
import { MarkdownImage } from "@/components/markdown-image.tsx";
import { cn } from "@/lib/cn/index.ts";
import { getVaultLinkUrl } from "@/lib/vault/link.ts";

interface VaultMarkdownProps {
  readonly beforeFootnotes?: ReactNode;
  readonly note: Pick<VaultFile, "body" | "resolveImage"> & {
    readonly links?: VaultFile["links"];
  };
}

type MarkdownLinkProps = ComponentProps<"a"> & {
  readonly node?: unknown;
};

const externalLinkPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu;

const MarkdownLink = ({
  children,
  className,
  href = "",
  node: _node,
  ...properties
}: MarkdownLinkProps) => {
  if ("data-footnote-ref" in properties || "data-footnote-backref" in properties) {
    return (
      <a
        {...properties}
        className={cn(
          "rounded-sm font-sans font-medium text-accent underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          className,
        )}
        href={href}
      >
        {children}
      </a>
    );
  }

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

const markdownOptions: ObsidianMarkdownProps["remarkRehypeOptions"] = {
  footnoteLabelProperties: {},
  handlers: {
    // Group the prose before Remark appends its generated footnotes.
    root: (state, node) => [
      {
        children: state.wrap(state.all(node)),
        properties: {},
        tagName: "article",
        type: "element",
      },
    ],
  },
};

const markdownComponents: ObsidianMarkdownProps["components"] = {
  a: MarkdownLink,
  blockquote: MarkdownBlockquote,
  hr: MarkdownHorizontalRule,
  img: MarkdownImage,
  section: ({ className, node: _node, ...properties }) => (
    <section
      {...properties}
      className={cn(
        "markdown mt-8 w-full border-t border-zinc-200 pt-4 text-accent dark:border-zinc-700",
        className,
      )}
    />
  ),
};

const VaultMarkdown = ({ beforeFootnotes, note }: VaultMarkdownProps) => (
  <ObsidianMarkdown
    components={{
      ...markdownComponents,
      article: ({ children }) => (
        <>
          <div className="markdown flex w-full flex-col items-start gap-2">{children}</div>
          {beforeFootnotes}
        </>
      ),
    }}
    links={note.links ?? []}
    remarkRehypeOptions={markdownOptions}
    resolveWikiImage={note.resolveImage}
    resolveWikiLink={getVaultLinkUrl}
  >
    {note.body}
  </ObsidianMarkdown>
);

export { VaultMarkdown };

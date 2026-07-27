import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VaultLink } from "../vault/types.ts";
import { findWikiLinks } from "../vault/wiki-link.ts";
import type { ObsidianMarkdownProps, ResolveWikiLink } from "./types.ts";

interface MarkdownNode {
  children?: MarkdownNode[];
  type: string;
  url?: string;
  value?: string;
}

const defaultResolveWikiLink: ResolveWikiLink = (link) => link.resolvedPath ?? link.target;

const splitWikiLinks = (
  value: string,
  links: readonly VaultLink[],
  resolveWikiLink: ResolveWikiLink,
): readonly MarkdownNode[] => {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of findWikiLinks(value)) {
    if (match.index > cursor) {
      nodes.push({
        type: "text",
        value: value.slice(cursor, match.index),
      });
    }

    const resolvedLink = links.find((candidate) => candidate.target === match.target);
    const link: VaultLink = {
      label: match.label,
      resolvedPath: resolvedLink?.resolvedPath ?? null,
      target: match.target,
      type: "link",
    };
    nodes.push({
      children: [
        {
          type: "text",
          value: match.label,
        },
      ],
      type: "link",
      url: resolveWikiLink(link),
    });

    cursor = match.index + match.raw.length;
  }

  if (cursor === 0) {
    return [
      {
        type: "text",
        value,
      },
    ];
  }

  if (cursor < value.length) {
    nodes.push({
      type: "text",
      value: value.slice(cursor),
    });
  }

  return nodes;
};

const transformWikiLinks = (
  node: MarkdownNode,
  links: readonly VaultLink[],
  resolveWikiLink: ResolveWikiLink,
  insideLink = false,
) => {
  if (!node.children) {
    return;
  }

  const children: MarkdownNode[] = [];

  for (const child of node.children) {
    if (child.type === "text" && child.value !== undefined && !insideLink) {
      children.push(...splitWikiLinks(child.value, links, resolveWikiLink));
    } else {
      const childIsLink = child.type === "link" || child.type === "linkReference";
      transformWikiLinks(child, links, resolveWikiLink, insideLink || childIsLink);
      children.push(child);
    }
  }

  node.children = children;
};

const createWikiLinkPlugin =
  (links: readonly VaultLink[], resolveWikiLink: ResolveWikiLink) => () => (tree: MarkdownNode) => {
    transformWikiLinks(tree, links, resolveWikiLink);
  };

const ObsidianMarkdown = ({
  children,
  components,
  links = [],
  resolveWikiLink = defaultResolveWikiLink,
}: ObsidianMarkdownProps) => (
  <Markdown
    components={components}
    remarkPlugins={[
      remarkGfm,
      createWikiLinkPlugin(links, resolveWikiLink),
    ]}
    skipHtml={true}
  >
    {children}
  </Markdown>
);

export { ObsidianMarkdown };

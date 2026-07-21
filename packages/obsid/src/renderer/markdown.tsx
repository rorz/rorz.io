import type { ComponentType } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

interface MarkdownNode {
  children?: MarkdownNode[];
  type: string;
  url?: string;
  value?: string;
}

type ResolveWikiLink = (target: string) => string;

interface ObsidianContentProps {
  readonly components?: Components;
  readonly resolveWikiLink?: ResolveWikiLink;
}

interface ObsidianFile {
  // biome-ignore lint/style/useNamingConvention: React component values use PascalCase.
  readonly Content: ComponentType<ObsidianContentProps>;
  readonly path: string;
  readonly source: string;
}

const defaultResolveWikiLink: ResolveWikiLink = (target) => target;

const removeFrontmatter = () => (tree: MarkdownNode) => {
  if (!tree.children) {
    return;
  }

  tree.children = tree.children.filter((node) => node.type !== "yaml" && node.type !== "toml");
};

const splitWikiLinks = (
  value: string,
  resolveWikiLink: ResolveWikiLink,
): readonly MarkdownNode[] => {
  const nodes: MarkdownNode[] = [];
  const pattern = /(?<!!)\[\[([^\]\n]+)\]\]/gu;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const { index } = match;
    const [, matchedBody] = match;
    const body = matchedBody ?? "";

    if (index > cursor) {
      nodes.push({ type: "text", value: value.slice(cursor, index) });
    }

    const separator = body.indexOf("|");
    let target = body.trim();
    let label = target;

    if (separator !== -1) {
      target = body.slice(0, separator).trim();
      label = body.slice(separator + 1).trim() || target;
    }

    if (target) {
      nodes.push({
        children: [{ type: "text", value: label }],
        type: "link",
        url: resolveWikiLink(target),
      });
    } else {
      nodes.push({ type: "text", value: match[0] });
    }

    cursor = index + match[0].length;
  }

  if (cursor === 0) {
    return [{ type: "text", value }];
  }

  if (cursor < value.length) {
    nodes.push({ type: "text", value: value.slice(cursor) });
  }

  return nodes;
};

const transformWikiLinks = (
  node: MarkdownNode,
  resolveWikiLink: ResolveWikiLink,
  insideLink = false,
) => {
  if (!node.children) {
    return;
  }

  const children: MarkdownNode[] = [];

  for (const child of node.children) {
    if (child.type === "text" && child.value !== undefined && !insideLink) {
      children.push(...splitWikiLinks(child.value, resolveWikiLink));
    } else {
      const childIsLink = child.type === "link" || child.type === "linkReference";
      transformWikiLinks(child, resolveWikiLink, insideLink || childIsLink);
      children.push(child);
    }
  }

  node.children = children;
};

const createWikiLinkPlugin = (resolveWikiLink: ResolveWikiLink) => () => (tree: MarkdownNode) => {
  transformWikiLinks(tree, resolveWikiLink);
};

const createObsidianFile = (path: string, source: string): ObsidianFile => {
  const Content = ({
    components,
    resolveWikiLink = defaultResolveWikiLink,
  }: ObsidianContentProps) => (
    <Markdown
      components={components}
      remarkPlugins={[
        remarkFrontmatter,
        removeFrontmatter,
        remarkGfm,
        createWikiLinkPlugin(resolveWikiLink),
      ]}
      skipHtml={true}
    >
      {source}
    </Markdown>
  );

  return {
    // biome-ignore lint/style/useNamingConvention: React component values use PascalCase.
    Content,
    path,
    source,
  };
};

export type { ObsidianContentProps, ObsidianFile, ResolveWikiLink };
export { createObsidianFile };

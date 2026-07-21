import Markdown from "react-markdown";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import type { ObsidianMarkdownProps, ResolveWikiLink } from "./types.ts";

interface MarkdownNode {
  children?: MarkdownNode[];
  type: string;
  url?: string;
  value?: string;
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
      nodes.push({
        type: "text",
        value: value.slice(cursor, index),
      });
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
        children: [
          {
            type: "text",
            value: label,
          },
        ],
        type: "link",
        url: resolveWikiLink(target),
      });
    } else {
      nodes.push({
        type: "text",
        value: match[0],
      });
    }

    cursor = index + match[0].length;
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

const ObsidianMarkdown = ({
  components,
  file,
  resolveWikiLink = defaultResolveWikiLink,
}: ObsidianMarkdownProps) => (
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
    {file.source}
  </Markdown>
);

export { ObsidianMarkdown };

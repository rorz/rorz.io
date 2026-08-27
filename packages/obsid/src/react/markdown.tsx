import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VaultLink } from "../vault/types.ts";
import { findWikiEmbeds, findWikiLinks } from "../vault/wiki-link.ts";
import type { ObsidianMarkdownProps, ResolveWikiImage, ResolveWikiLink } from "./types.ts";

interface MarkdownNode {
  alt?: string;
  children?: MarkdownNode[];
  data?: {
    hProperties?: {
      height?: number;
      width?: number;
    };
  };
  type: string;
  url?: string;
  value?: string;
}

interface WikiMatch {
  readonly index: number;
  readonly label: string;
  readonly raw: string;
  readonly target: string;
  readonly type: "image" | "link";
}

interface WikiTransformContext {
  readonly links: readonly VaultLink[];
  readonly resolveWikiImage: ResolveWikiImage;
  readonly resolveWikiLink: ResolveWikiLink;
}

const defaultResolveWikiLink: ResolveWikiLink = (link) => link.resolvedPath ?? link.target;
const defaultResolveWikiImage: ResolveWikiImage = () => null;
const imageDimensionsPattern = /^(\d+)(?:x(\d+))?$/u;

const parseImageDimensions = (
  value: string,
): Readonly<{
  height?: number;
  width: number;
}> | null => {
  const match = imageDimensionsPattern.exec(value);

  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = match[2] === undefined ? undefined : Number(match[2]);

  if (width === 0 || height === 0) {
    return null;
  }

  return height === undefined
    ? {
        width,
      }
    : {
        height,
        width,
      };
};

const parseExternalImageAlt = (
  value: string,
): Readonly<{
  alt: string;
  dimensions: NonNullable<ReturnType<typeof parseImageDimensions>>;
}> | null => {
  const dimensions = parseImageDimensions(value);

  if (dimensions !== null) {
    return {
      alt: "",
      dimensions,
    };
  }

  const separatorIndex = value.lastIndexOf("|");

  if (separatorIndex === -1) {
    return null;
  }

  const labelledDimensions = parseImageDimensions(value.slice(separatorIndex + 1));

  if (labelledDimensions === null) {
    return null;
  }

  return {
    alt: value.slice(0, separatorIndex),
    dimensions: labelledDimensions,
  };
};

const findWikiMatches = (value: string): readonly WikiMatch[] =>
  [
    ...findWikiLinks(value).map((match) => ({
      ...match,
      type: "link" as const,
    })),
    ...findWikiEmbeds(value).map((match) => ({
      ...match,
      type: "image" as const,
    })),
  ].toSorted((left, right) => left.index - right.index);

const createWikiNode = (match: WikiMatch, context: WikiTransformContext): MarkdownNode => {
  if (match.type === "image") {
    const url = context.resolveWikiImage(match.target);

    if (url === null) {
      return {
        type: "text",
        value: match.raw,
      };
    }

    const dimensions = parseImageDimensions(match.label);

    return {
      alt: dimensions === null ? match.label : match.target,
      ...(dimensions === null
        ? {}
        : {
            data: {
              hProperties: dimensions,
            },
          }),
      type: "image",
      url,
    };
  }

  const resolvedLink = context.links.find((candidate) => candidate.target === match.target);
  const link: VaultLink = {
    label: match.label,
    resolvedPath: resolvedLink?.resolvedPath ?? null,
    target: match.target,
    type: "link",
  };

  return {
    children: [
      {
        type: "text",
        value: match.label,
      },
    ],
    type: "link",
    url: context.resolveWikiLink(link),
  };
};

const splitWikiLinks = (value: string, context: WikiTransformContext): readonly MarkdownNode[] => {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;
  const matches = findWikiMatches(value);

  for (const match of matches) {
    if (match.index > cursor) {
      nodes.push({
        type: "text",
        value: value.slice(cursor, match.index),
      });
    }

    nodes.push(createWikiNode(match, context));
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
  context: WikiTransformContext,
  insideLink = false,
) => {
  if (!node.children) {
    return;
  }

  const children: MarkdownNode[] = [];

  for (const child of node.children) {
    if (child.type === "text" && child.value !== undefined && !insideLink) {
      children.push(...splitWikiLinks(child.value, context));
    } else {
      const childIsLink = child.type === "link" || child.type === "linkReference";
      transformWikiLinks(child, context, insideLink || childIsLink);
      children.push(child);
    }
  }

  node.children = children;
};

const createWikiLinkPlugin =
  (
    links: readonly VaultLink[],
    resolveWikiImage: ResolveWikiImage,
    resolveWikiLink: ResolveWikiLink,
  ) =>
  () =>
  (tree: MarkdownNode) => {
    transformWikiLinks(tree, {
      links,
      resolveWikiImage,
      resolveWikiLink,
    });
  };

const transformExternalImageDimensions = (node: MarkdownNode) => {
  if (node.type === "image" && node.alt !== undefined) {
    const parsed = parseExternalImageAlt(node.alt);

    if (parsed !== null) {
      node.alt = parsed.alt;
      node.data = {
        ...node.data,
        hProperties: {
          ...node.data?.hProperties,
          ...parsed.dimensions,
        },
      };
    }
  }

  for (const child of node.children ?? []) {
    transformExternalImageDimensions(child);
  }
};

const createExternalImageDimensionsPlugin = () => (tree: MarkdownNode) => {
  transformExternalImageDimensions(tree);
};

const ObsidianMarkdown = ({
  children,
  components,
  links = [],
  resolveWikiImage = defaultResolveWikiImage,
  resolveWikiLink = defaultResolveWikiLink,
}: ObsidianMarkdownProps) => (
  <Markdown
    components={components}
    remarkPlugins={[
      remarkGfm,
      createWikiLinkPlugin(links, resolveWikiImage, resolveWikiLink),
      createExternalImageDimensionsPlugin,
    ]}
    skipHtml={true}
  >
    {children}
  </Markdown>
);

export { ObsidianMarkdown };

import { expect, mock, test } from "bun:test";
import { Children, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/image", () => ({
  default: ({ alt, src }: { readonly alt: string; readonly src: string }) => (
    // biome-ignore lint/performance/noImgElement: This native element is the test double for Next Image.
    <img alt={alt} height={1} src={src} width={1} />
  ),
}));

mock.module("next/link", () => ({
  default: ({ children, href }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { default: schema } = await import("@/lib/vault/schema.tsx");

const projectProperties = {
  byline: {
    raw: "OSS GTM engineering tool",
    type: "string",
    value: "OSS GTM engineering tool",
  },
  date: new Date("2026-01-01"),
  image: {
    raw: "https://assets.rorz.io/images/project-thumbnails/marble.png",
    type: "link",
    url: "https://assets.rorz.io/images/project-thumbnails/marble.png",
  },
  link: {
    raw: "https://marble.space",
    type: "link",
    url: "https://marble.space",
  },
} as const;

const projectGrid = {
  folder: {
    vaultPath: "Work",
  },
  kind: "grid",
  name: "page",
  properties: {
    gridOf: {
      raw: "project",
      type: "string",
      value: "project",
    },
  },
  webPath: "/work",
} as const;

test("composes project metadata in the subtitle and keeps its thumbnail in the content", async () => {
  const rendered = await schema.renderers.project({
    note: {
      body: "Project body.",
      folder: {
        vaultPath: "Work",
      },
      name: "Marble",
      properties: projectProperties,
      resolveImage: () => null,
      webPath: "/work/marble",
    },
    query: {
      findMany: ({ kind }: { readonly kind: string }) => {
        if (kind === "grid") {
          return Promise.resolve([
            projectGrid,
          ]);
        }
        return Promise.resolve([
          {
            kind: "project",
            name: "Marble",
            properties: projectProperties,
            webPath: "/work/marble",
          },
        ]);
      },
    },
  } as never);
  const page = rendered as ReactElement<{
    readonly children: ReactNode;
    readonly subtitle: ReactNode;
  }>;
  const [thumbnail] = Children.toArray(page.props.children);
  const thumbnailHtml = renderToStaticMarkup(thumbnail);

  expect(page.props.subtitle).not.toBeNull();
  expect(thumbnailHtml).toContain("aspect-video");
  expect(thumbnailHtml).toContain("w=1280 1280w");
  expect(thumbnailHtml).not.toContain(
    'src="https://assets.rorz.io/images/project-thumbnails/marble.png"',
  );
});

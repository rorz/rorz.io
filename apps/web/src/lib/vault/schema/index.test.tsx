import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/image", () => ({
  default: ({ alt, src }: { readonly alt: string; readonly src: string }) => (
    // biome-ignore lint/performance/noImgElement: This native element is the test double for Next Image.
    <img alt={alt} height={1} src={src} width={1} />
  ),
}));

mock.module("next/link", () => ({
  default: ({ children, href }: { readonly children: React.ReactNode; readonly href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { default: schema } = await import("@/lib/vault/schema.tsx");

const sections = [
  {
    label: "Recent writing",
    path: "Writing/page",
    raw: "[[Writing/page|Recent writing]]",
    type: "note",
  },
  {
    label: "Photographs",
    path: "Images/Photographs/page",
    raw: "[[Images/Photographs/page|Photographs]]",
    type: "note",
  },
] as const;

const indexes = {
  "Images/Photographs/page": {
    folder: {
      vaultPath: "Images/Photographs",
    },
    kind: "grid",
    name: "page",
    properties: {
      gridOf: {
        raw: "image",
        type: "string",
        value: "image",
      },
    },
    webPath: "/images/photographs",
  },
  "Writing/page": {
    folder: {
      vaultPath: "Writing",
    },
    kind: "list",
    name: "page",
    properties: {
      listOf: {
        raw: "post",
        type: "string",
        value: "post",
      },
    },
    webPath: "/writing",
  },
} as const;

const entries = {
  image: [
    {
      kind: "image",
      name: "Shibuya",
      properties: {
        date: new Date("2026-03-01"),
        src: {
          raw: "https://images.example.com/shibuya.jpg",
          type: "link",
          url: "https://images.example.com/shibuya.jpg",
        },
      },
      webPath: "/images/photographs/shibuya",
    },
  ],
  post: [
    {
      kind: "post",
      name: "An entry",
      properties: {
        date: new Date("2026-03-03"),
      },
      webPath: "/writing/an-entry",
    },
  ],
  video: [],
} as const;

test("renders list and grid references as ordered index sections", async () => {
  const rendered = await schema.renderers.index({
    note: {
      properties: {
        sections,
      },
    },
    query: {
      findMany: ({ kind }: { readonly kind: keyof typeof entries }) =>
        Promise.resolve(entries[kind]),
      resolveOrThrow: ({ path }: { readonly path: keyof typeof indexes }) =>
        Promise.resolve(indexes[path]),
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain("An entry");
  expect(html).toContain('src="https://images.example.com/shibuya.jpg"');
  expect(html.indexOf("Recent writing")).toBeLessThan(html.indexOf("Photographs"));
});

test("rejects aggregate notes as index sections", async () => {
  await expect(
    schema.renderers.index({
      note: {
        properties: {
          sections: sections.slice(0, 1),
        },
      },
      query: {
        resolveOrThrow: () =>
          Promise.resolve({
            kind: "listOfLists",
          }),
      },
    } as never),
  ).rejects.toThrow("Expected a list or grid note, resolved: listOfLists");
});

test("renders a page title only when one is set", async () => {
  const titled = await schema.renderers.page({
    note: {
      body: "About page body.",
      properties: {
        title: {
          raw: "About me",
          type: "string",
          value: "About me",
        },
      },
      resolveImage: () => null,
    },
  } as never);
  const untitled = await schema.renderers.page({
    note: {
      body: "Untitled page body.",
      properties: {},
      resolveImage: () => null,
    },
  } as never);
  const titledHtml = renderToStaticMarkup(titled);
  const untitledHtml = renderToStaticMarkup(untitled);

  expect(titledHtml).toContain("<h1");
  expect(titledHtml).toContain("About me</h1>");
  expect(titledHtml).toContain("About page body.");
  expect(untitledHtml).not.toContain("<h1");
  expect(untitledHtml).toContain("Untitled page body.");
});

import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

interface MockImageProps {
  readonly alt: string;
  readonly className?: string;
  readonly fill?: boolean;
  readonly sizes?: string;
  readonly src: string;
}

interface MockLinkProps {
  readonly "aria-label"?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly href: string;
}

mock.module("next/image", () => ({
  default: ({ alt, className, src }: MockImageProps) => (
    // biome-ignore lint/performance/noImgElement: This native element is the test double for Next Image.
    <img alt={alt} className={className} height={1} src={src} width={1} />
  ),
}));

mock.module("next/link", () => ({
  default: ({ "aria-label": ariaLabel, children, className, href }: MockLinkProps) => (
    <a aria-label={ariaLabel} className={className} href={href}>
      {children}
    </a>
  ),
}));

const { CollectionGrid, CollectionGridItem } = await import("./collection-grid.tsx");
const { default: schema } = await import("@/lib/vault/schema.tsx");

test("renders a linked collection card with its image and description", () => {
  const html = renderToStaticMarkup(
    <CollectionGrid>
      <CollectionGridItem
        description="1st Mar 2026"
        href="/images/photographs/shibuya-hd"
        imageAlt=""
        imageSrc="https://images.example.com/shibuya.jpg"
        title="Shibuya HD"
      />
    </CollectionGrid>,
  );

  expect(html).toContain('<ul class="grid gap-4 w-full grid-cols-2">');
  expect(html).toContain('href="/images/photographs/shibuya-hd"');
  expect(html).toContain('src="https://images.example.com/shibuya.jpg"');
  expect(html).toContain("Shibuya HD");
  expect(html).toContain("1st Mar 2026");
});

test("renders collection previews as a single non-wrapping row", () => {
  const html = renderToStaticMarkup(
    <CollectionGrid layout="row">
      <CollectionGridItem
        href="/images/photographs/shibuya-hd"
        imageAlt=""
        imageSrc="https://images.example.com/shibuya.jpg"
        title="Shibuya HD"
        variant="icon"
      />
    </CollectionGrid>,
  );

  expect(html).toContain("grid-flow-col");
  expect(html).toContain("auto-cols-[calc((100%_-_2rem)/3)]");
  expect(html).toContain("lg:auto-cols-[calc((100%_-_3rem)/4)]");
  expect(html).toContain("overflow-x-auto");
  expect(html).toContain("aspect-square");
  expect(html).toContain('aria-label="Shibuya HD"');
  expect(html).toContain("hover:border-black");
  expect(html).toContain('<article class="border">');
  expect(html).not.toContain("<h3");
  expect(html).not.toContain("1st Mar 2026");
  expect(html).not.toContain("font-serif");
});

test("renders every root image preview in one responsive row", async () => {
  const findMany = mock((_options: Readonly<Record<string, unknown>>) =>
    Promise.resolve([
      {
        kind: "image",
        name: "Shibuya HD",
        properties: {
          date: new Date("2026-03-01"),
          src: {
            raw: "https://images.example.com/shibuya.jpg",
            type: "link",
            url: "https://images.example.com/shibuya.jpg",
          },
        },
        webPath: "/images/photographs/shibuya-hd",
      },
    ]),
  );
  const rendered = await schema.renderers.gridOfGrids({
    note: {
      folder: {
        vaultPath: "Images",
      },
      name: "page",
      properties: {
        grids: [
          {
            label: "Photographs",
            path: "Images/Photographs/page",
            raw: "[[Images/Photographs/page|Photographs]]",
            type: "note",
          },
        ],
      },
    },
    query: {
      findMany,
      resolveOrThrow: () =>
        Promise.resolve({
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
        }),
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain("Photographs");
  expect(html).toContain("grid-flow-col");
  expect(html).toContain("Shibuya HD");
  expect(html).not.toContain("1st Mar 2026");
  expect(findMany.mock.calls[0]?.[0]).not.toHaveProperty("limit");
});

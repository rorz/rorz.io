import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

interface MockImageProps {
  readonly alt: string;
  readonly className?: string;
  readonly fill?: boolean;
  readonly sizes?: string;
  readonly src: string;
  readonly unoptimized?: boolean;
}

interface MockLinkProps {
  readonly "aria-label"?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly href: string;
}

interface MockFindManyOptions {
  readonly kind?: string;
  readonly limit?: number;
}

mock.module("next/image", () => ({
  default: ({ alt, className, src, unoptimized }: MockImageProps) => (
    // biome-ignore lint/performance/noImgElement: This native element is the test double for Next Image.
    <img
      alt={alt}
      className={className}
      data-unoptimized={unoptimized || undefined}
      height={1}
      src={src}
      width={1}
    />
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

const imageEntry = {
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
} as const;

const videoEntry = {
  kind: "video",
  name: "Crossing",
  properties: {
    date: new Date("2026-03-02"),
    src: {
      raw: "https://videos.example.com/crossing.mp4",
      type: "link",
      url: "https://videos.example.com/crossing.mp4",
    },
    thumbnail: {
      raw: "https://images.example.com/crossing.jpg",
      type: "link",
      url: "https://images.example.com/crossing.jpg",
    },
  },
  webPath: "/images/photographs/crossing",
} as const;

const findMediaEntries = (options: MockFindManyOptions) => {
  if (options.kind === "image") {
    return Promise.resolve([
      imageEntry,
    ]);
  }
  if (options.kind === "video") {
    return Promise.resolve([
      videoEntry,
    ]);
  }
  return Promise.resolve([]);
};

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

test("routes assets.rorz.io thumbnails through the restricted image endpoint", () => {
  const imageSrc = "https://assets.rorz.io/videos/nara.thumbnail.png";
  const html = renderToStaticMarkup(
    <CollectionGrid>
      <CollectionGridItem
        href="/images/preview"
        imageAlt=""
        imageSrc={imageSrc}
        title="Preview"
        variant="icon"
      />
    </CollectionGrid>,
  );

  expect(html).toContain('src="/_images/thumbnail?');
  expect(html).toContain("w=256 256w");
  expect(html).toContain("w=640 640w");
  expect(html).not.toContain(`src="${imageSrc}`);
});

test("renders at most four collection previews in a responsive row", () => {
  const html = renderToStaticMarkup(
    <CollectionGrid layout="row">
      {[
        "Shibuya HD",
        "Shinjuku",
        "Hiroshima",
        "Kyoto",
        "Osaka",
      ].map((title) => (
        <CollectionGridItem
          href={`/images/photographs/${title.toLowerCase().replace(" ", "-")}`}
          imageAlt=""
          imageSrc="https://images.example.com/shibuya.jpg"
          key={title}
          title={title}
          variant="icon"
        />
      ))}
    </CollectionGrid>,
  );

  expect(html).toContain("grid-cols-3");
  expect(html).toContain("lg:grid-cols-4");
  expect(html).toContain("[&amp;&gt;li:nth-child(4)]:hidden");
  expect(html).not.toContain("overflow-x-auto");
  expect(html).toContain("aspect-square");
  expect(html).toContain('aria-label="Shibuya HD"');
  expect(html).not.toContain('aria-label="Osaka"');
  expect(html).toContain("hover:border-black");
  expect(html).toContain('<article class="border">');
  expect(html).not.toContain("<h3");
  expect(html).not.toContain("1st Mar 2026");
  expect(html).not.toContain("font-serif");
});

test("renders image and video previews together in one responsive row", async () => {
  const findMany = mock(findMediaEntries);
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
  expect(html).toContain("grid-cols-3");
  expect(html).toContain("Shibuya HD");
  expect(html).toContain('aria-label="Crossing"');
  expect(html).toContain('src="https://images.example.com/crossing.jpg"');
  expect(html).toContain("size-9 flex items-center justify-center bg-black text-white");
  expect(html).not.toContain("1st Mar 2026");
  expect(findMany.mock.calls.map(([options]) => options.kind)).toEqual([
    "image",
    "video",
  ]);
  expect(findMany.mock.calls.every(([options]) => options.limit === undefined)).toBe(true);
});

test("renders a complete image at its intrinsic aspect ratio", async () => {
  const rendered = await schema.renderers.image({
    note: {
      body: "",
      folder: {
        vaultPath: "Images/Photographs",
      },
      name: "Shibuya HD",
      properties: imageEntry.properties,
      resolveImage: () => null,
    },
    query: {
      findMany: () => Promise.resolve([]),
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain('class="block max-w-full h-auto"');
  expect(html).toContain('data-unoptimized="true"');
  expect(html).not.toContain("aspect-4/3");
  expect(html).not.toContain("object-contain");
});

test("renders a video note with a native controlled player", async () => {
  const rendered = await schema.renderers.video({
    note: {
      body: "",
      folder: {
        vaultPath: "Images/Photographs",
      },
      name: "Crossing",
      properties: {
        date: new Date("2026-03-02"),
        src: {
          raw: "https://videos.example.com/crossing.mp4",
          type: "link",
          url: "https://videos.example.com/crossing.mp4",
        },
        thumbnail: {
          raw: "https://images.example.com/crossing.jpg",
          type: "link",
          url: "https://images.example.com/crossing.jpg",
        },
      },
      resolveImage: () => null,
    },
    query: {
      findMany: () =>
        Promise.resolve([
          {
            kind: "grid",
            webPath: "/images/photographs",
          },
        ]),
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain("<video");
  expect(html).toContain("controls");
  expect(html).toContain("playsInline");
  expect(html).toContain('class="block max-w-full h-auto bg-black"');
  expect(html).not.toContain("w-full max-h-[70vh]");
  expect(html).not.toContain("poster=");
  expect(html).toContain('src="https://videos.example.com/crossing.mp4"');
});

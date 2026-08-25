import { expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

interface MockImageProps {
  readonly alt: string;
  readonly className?: string;
  readonly src: string;
  readonly unoptimized?: boolean;
}

interface FindManyOptions {
  readonly kind?: string;
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
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: ReactNode;
    readonly href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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

const newerImageEntry = {
  ...imageEntry,
  name: "Kyoto",
  properties: {
    ...imageEntry.properties,
    date: new Date("2026-03-03"),
  },
  webPath: "/images/photographs/kyoto",
} as const;

const photographsGrid = {
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
} as const;

const findNavigationMediaEntries = (options: FindManyOptions) => {
  if (options.kind === "grid") {
    return Promise.resolve([
      photographsGrid,
    ]);
  }
  if (options.kind === "image") {
    return Promise.resolve([
      imageEntry,
      newerImageEntry,
    ]);
  }
  if (options.kind === "video") {
    return Promise.resolve([
      videoEntry,
    ]);
  }
  return Promise.resolve([]);
};

test("renders a complete image at its intrinsic aspect ratio", async () => {
  const rendered = await schema.renderers.image({
    note: {
      body: "",
      folder: photographsGrid.folder,
      name: imageEntry.name,
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

test("uses collection ordering for previous and next links", async () => {
  const rendered = await schema.renderers.video({
    note: {
      body: "",
      folder: photographsGrid.folder,
      name: videoEntry.name,
      properties: videoEntry.properties,
      resolveImage: () => null,
      webPath: videoEntry.webPath,
    },
    query: {
      findMany: findNavigationMediaEntries,
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain("<video");
  expect(html).toContain("controls");
  expect(html).toContain("playsInline");
  expect(html).toContain('class="block max-w-full h-auto bg-black"');
  expect(html).toContain('src="https://videos.example.com/crossing.mp4"');
  expect(html).toContain('aria-label="Previous: Kyoto"');
  expect(html).toContain('href="/images/photographs/kyoto"');
  expect(html).toContain('aria-label="Next: Shibuya HD"');
  expect(html).toContain('href="/images/photographs/shibuya-hd"');
  expect(html.match(/aria-hidden="true"/gu)).toHaveLength(2);
});

import { expect, mock, test } from "bun:test";
import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

interface MockLinkProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly href: string;
}

type MockImageProps = ComponentProps<"img"> & {
  readonly unoptimized?: boolean;
};

const renderNextImage = mock((_properties: MockImageProps) => null);
const externalImageUrl = "https://example.com/dithered.webp";

mock.module("next/image", () => ({
  default: renderNextImage,
}));

mock.module("next/link", () => ({
  default: ({ children, className, href }: MockLinkProps) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

const { VaultMarkdown } = await import("./vault-markdown.tsx");

test("distinguishes external links and resolves internal Markdown and wiki links", () => {
  const html = renderToStaticMarkup(
    <VaultMarkdown
      note={{
        body: "[About](/about), [[Verdn]], and [Obsidian](https://obsidian.md).",
        links: [
          {
            label: "Verdn",
            resolvedPath: "Work/Verdn",
            target: "Verdn",
            type: "link",
          },
        ],
        resolveImage: () => null,
      }}
    />,
  );

  expect(html).toContain('href="/about"><span>About</span>');
  expect(html).toContain('href="/work/verdn"><span>Verdn</span>');
  expect(html).toContain(
    'href="https://obsidian.md" rel="noopener" target="_blank"><span>Obsidian</span>',
  );
});

test("renders external Markdown images directly with parsed dimensions", () => {
  renderNextImage.mockClear();

  renderToStaticMarkup(
    <VaultMarkdown
      note={{
        body: `![640](${externalImageUrl})`,
        resolveImage: () => null,
      }}
    />,
  );

  expect(renderNextImage).toHaveBeenCalledTimes(1);
  expect(renderNextImage.mock.calls[0]?.[0]).toMatchObject({
    alt: "",
    sizes: "(max-width: 640px) 100vw, 640px",
    src: externalImageUrl,
    unoptimized: true,
    width: 640,
  });
});

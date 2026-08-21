import { expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

interface MockLinkProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly href: string;
}

mock.module("next/image", () => ({
  default: () => null,
}));

mock.module("next/link", () => ({
  default: ({ children, className, href }: MockLinkProps) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

const { VaultMarkdown } = await import("./vault-markdown.tsx");

test("renders styled lists and internal and external links", () => {
  const html = renderToStaticMarkup(
    <VaultMarkdown
      note={{
        body: `1. First
2. Second

- Third
- Fourth

[About](/about) and [Obsidian](https://obsidian.md).`,
        resolveImage: () => null,
      }}
    />,
  );

  expect(html).toContain('<div class="markdown flex w-full flex-col items-start gap-2"><ol>');
  expect(html).toContain("<ul>");
  expect(html).toContain('href="/about"><span>About</span>');
  expect(html).toContain(
    'href="https://obsidian.md" rel="noopener" target="_blank"><span>Obsidian</span>',
  );
  expect(html.match(/<svg/gu)).toHaveLength(2);
});

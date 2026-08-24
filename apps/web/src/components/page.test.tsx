import { expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/link", () => ({
  default: ({ children, href }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { Page } = await import("./page.tsx");

test("renders arbitrary subtitle content before the page content", () => {
  const html = renderToStaticMarkup(
    <Page
      subtitle={
        <div>
          <span>Subtitle</span>
          <a href="https://example.com">Example</a>
        </div>
      }
      title="Title"
    >
      <p>Content</p>
    </Page>,
  );
  const positions = [
    html.indexOf("Title"),
    html.indexOf("Subtitle"),
    html.indexOf("https://example.com"),
    html.indexOf("Content"),
  ];

  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual(positions.toSorted((left, right) => left - right));
});

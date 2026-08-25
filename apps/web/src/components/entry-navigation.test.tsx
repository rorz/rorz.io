import { expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/link", () => ({
  default: ({ children, href }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { EntryNavigation } = await import("./entry-navigation.tsx");

test("renders only the entry navigation directions that exist", () => {
  const firstHtml = renderToStaticMarkup(
    <EntryNavigation
      next={{
        href: "/next",
        title: "Next item",
      }}
    />,
  );
  const lastHtml = renderToStaticMarkup(
    <EntryNavigation
      previous={{
        href: "/previous",
        title: "Previous item",
      }}
    />,
  );
  const onlyHtml = renderToStaticMarkup(<EntryNavigation />);

  expect(firstHtml).toContain('href="/next"');
  expect(firstHtml).toContain("<svg");
  expect(firstHtml).toContain('aria-hidden="true"');
  expect(firstHtml).not.toContain("Previous item");
  expect(lastHtml).toContain('href="/previous"');
  expect(lastHtml).toContain("<svg");
  expect(lastHtml).toContain('aria-hidden="true"');
  expect(lastHtml).not.toContain("Next item");
  expect(onlyHtml).toBe("");
});

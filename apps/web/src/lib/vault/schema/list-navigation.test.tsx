import { expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("next/image", () => ({
  default: () => null,
}));

mock.module("next/link", () => ({
  default: ({ children, href }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { default: schema } = await import("@/lib/vault/schema.tsx");

interface FindManyOptions {
  readonly folder: {
    readonly vaultPath: string;
  };
  readonly kind: string;
  readonly limit?: number;
  readonly orderBy?: unknown;
}

const bookProperties = (author: string, date: string) => ({
  author: {
    raw: author,
    type: "string" as const,
    value: author,
  },
  date: new Date(date),
  rating: 5,
});

const readingEntries = [
  {
    kind: "book",
    name: "Dune",
    properties: bookProperties("Frank Herbert", "2026-09-01"),
    webPath: "/lists/reading/dune",
  },
  {
    kind: "book",
    name: "Animal Farm",
    properties: bookProperties("George Orwell", "2026-08-01"),
    webPath: "/lists/reading/animal-farm",
  },
  {
    kind: "book",
    name: "The Hobbit",
    properties: bookProperties("J. R. R. Tolkien", "2026-07-01"),
    webPath: "/lists/reading/the-hobbit",
  },
] as const;

const readingList = {
  folder: {
    vaultPath: "Lists/Reading",
  },
  kind: "list",
  name: "page",
  properties: {
    listOf: {
      raw: "book",
      type: "string",
      value: "book",
    },
  },
  webPath: "/lists/reading",
} as const;

test("uses the list ordering for previous and next entry links", async () => {
  const findMany = mock(({ kind }: FindManyOptions) =>
    Promise.resolve(
      kind === "list"
        ? [
            readingList,
          ]
        : readingEntries,
    ),
  );
  const [, current] = readingEntries;
  const rendered = await schema.renderers.book({
    note: {
      body: "",
      folder: readingList.folder,
      name: current.name,
      properties: current.properties,
      resolveImage: () => null,
      webPath: current.webPath,
    },
    query: {
      findMany,
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain('href="/lists/reading/dune"');
  expect(html).toContain("Dune");
  expect(html).toContain('href="/lists/reading/the-hobbit"');
  expect(html).toContain("The Hobbit");
  expect(findMany.mock.calls[1]?.[0]).toEqual({
    folder: readingList.folder,
    kind: "book",
    orderBy: expect.any(Function),
  });
});

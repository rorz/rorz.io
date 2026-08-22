import { expect, mock, test } from "bun:test";
import type { ReactElement, ReactNode } from "react";

mock.module("next/image", () => ({
  default: () => null,
}));

mock.module("next/link", () => ({
  default: ({ children, href }: { readonly children: ReactNode; readonly href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const { Page } = await import("@/components/page.tsx");
const { default: schema } = await import("@/lib/vault/schema.tsx");

interface RenderedPageProps {
  readonly backNavigation?: {
    readonly href: string;
    readonly title: string;
  };
}

interface FindManyOptions {
  readonly folder: {
    readonly vaultPath: string;
  };
  readonly kind?: string;
  readonly limit?: number;
}

interface EntryCase {
  readonly expectedHref: string;
  readonly expectedTitle: string;
  readonly folder: string;
  readonly kind: "book" | "place" | "thing";
  readonly name: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

const entryCases: EntryCase[] = [
  {
    expectedHref: "/lists/reading",
    expectedTitle: "Reading",
    folder: "Lists/Reading",
    kind: "book",
    name: "Animal Farm",
    properties: {
      author: {
        raw: "George Orwell",
        type: "string",
        value: "George Orwell",
      },
      date: new Date("2026-08-01"),
      rating: 4,
    },
  },
  {
    expectedHref: "/lists/places",
    expectedTitle: "Places",
    folder: "Lists/Places",
    kind: "place",
    name: "Lauretta's",
    properties: {
      date: new Date("2025-04-01"),
      rating: 4.5,
    },
  },
  {
    expectedHref: "/lists/the-best",
    expectedTitle: "The Best",
    folder: "Lists/The Best",
    kind: "thing",
    name: "Cinnamon bun",
    properties: {
      date: new Date("2027-01-01"),
      from: {
        raw: "Long White Cloud",
        type: "string",
        value: "Long White Cloud",
      },
    },
  },
];

test.each(entryCases)("links a nested $kind entry back to its containing list", async (entry) => {
  const findMany = mock(({ folder }: FindManyOptions) =>
    Promise.resolve([
      {
        kind: "list" as const,
        webPath: `/${folder.vaultPath.toLowerCase().replaceAll(" ", "-")}`,
      },
    ]),
  );
  const query = {
    findMany,
  };
  const renderer = schema.renderers[entry.kind] as (
    context: never,
  ) => ReactNode | Promise<ReactNode>;
  const rendered = await renderer({
    note: {
      body: "",
      folder: {
        vaultPath: entry.folder,
      },
      name: entry.name,
      properties: entry.properties,
      resolveImage: () => null,
    },
    query,
  } as never);
  const page = rendered as ReactElement<RenderedPageProps>;

  expect(page.type).toBe(Page);
  expect(page.props.backNavigation).toEqual({
    href: entry.expectedHref,
    title: entry.expectedTitle,
  });
  expect(findMany).toHaveBeenCalledTimes(1);
  expect(findMany).toHaveBeenCalledWith({
    folder: {
      vaultPath: entry.folder,
    },
    kind: "list",
    limit: 1,
  });
});

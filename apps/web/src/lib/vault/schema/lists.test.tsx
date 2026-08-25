import { expect, mock, test } from "bun:test";
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
  readonly orderBy?: unknown;
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

const readingEntries = [
  {
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
    webPath: "/lists/reading/animal-farm",
  },
  {
    kind: "book",
    name: "The Hobbit",
    properties: {
      author: {
        raw: "J. R. R. Tolkien",
        type: "string",
        value: "J. R. R. Tolkien",
      },
      date: new Date("2026-07-01"),
      rating: 5,
    },
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

const createEntryFindMany = (entry: EntryCase, currentWebPath: string) =>
  mock(({ kind }: FindManyOptions) => {
    if (kind === "list") {
      return Promise.resolve([
        {
          folder: {
            vaultPath: entry.folder,
          },
          kind: "list" as const,
          name: "page",
          properties: {
            listOf: {
              raw: entry.kind,
              type: "string",
              value: entry.kind,
            },
          },
          webPath: entry.expectedHref,
        },
      ]);
    }

    return Promise.resolve([
      {
        kind: entry.kind,
        name: entry.name,
        properties: entry.properties,
        webPath: currentWebPath,
      },
    ]);
  });

test.each(entryCases)("links a nested $kind entry back to its containing list", async (entry) => {
  const currentWebPath = `${entry.expectedHref}/entry`;
  const findMany = createEntryFindMany(entry, currentWebPath);
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
      webPath: currentWebPath,
    },
    query,
  } as never);
  const page = rendered as ReactElement<RenderedPageProps>;

  expect(page.type).toBe(Page);
  expect(page.props.backNavigation).toEqual({
    href: entry.expectedHref,
    title: entry.expectedTitle,
  });
  expect(findMany).toHaveBeenCalledTimes(2);
  expect(findMany.mock.calls[0]?.[0]).toEqual({
    folder: {
      vaultPath: entry.folder,
    },
    kind: "list",
    limit: 1,
  });
  expect(findMany.mock.calls[1]?.[0]).toEqual({
    folder: {
      vaultPath: entry.folder,
    },
    kind: entry.kind,
    orderBy: expect.any(Function),
  });
});

test("shows the total record count when a list preview is limited", async () => {
  const findMany = mock(() => Promise.resolve(readingEntries));
  const rendered = await schema.renderers.listOfLists({
    note: {
      folder: {
        vaultPath: "Lists",
      },
      name: "page",
      properties: {
        limitPer: 1,
        lists: [
          {
            label: "Reading",
            path: "Lists/Reading/page",
            raw: "[[Lists/Reading/page|Reading]]",
            type: "note",
          },
        ],
      },
    },
    query: {
      findMany,
      resolveOrThrow: () => Promise.resolve(readingList),
    },
  } as never);
  const html = renderToStaticMarkup(rendered);

  expect(html).toContain("Animal Farm");
  expect(html).not.toContain("The Hobbit");
  expect(html).toContain('<a href="/lists/reading">View All (2)</a>');
  expect(findMany).toHaveBeenCalledWith({
    folder: {
      vaultPath: "Lists/Reading",
    },
    kind: "book",
    orderBy: expect.any(Function),
  });
});

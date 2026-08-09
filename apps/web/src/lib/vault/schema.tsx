import { format } from "date-fns/fp";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import { defineSchema, desc, note, p } from "obsid/schema";
import { StringPropertyLinkTypeSchema, type StringPropertyValue } from "obsid/types";
import type { ReactNode } from "react";
import { List, ListItem } from "@/components/list/index.tsx";
import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { webPermalink } from "@/lib/vault/routing.ts";

const dated = {
  date: p.date(),
};
const titled = {
  title: p.text().optional(),
};

const page = note("page", {});

const post = note("post", {
  ...dated,
  ...titled,
});

const place = note("place", {
  ...dated,
  rating: p.number().optional(),
});

const thing = note("thing", {
  ...dated,
  from: p.text(),
});

const project = note("project", {
  ...dated,
  ...titled,
  byline: p.text(),
  image: p.text().pipe(StringPropertyLinkTypeSchema),
  link: p.text().pipe(StringPropertyLinkTypeSchema),
});

const entries = [
  post,
  place,
  thing,
  project,
] as const;

const renderText = (property: StringPropertyValue): string => {
  if (property.type === "string") {
    return property.value;
  }
  if (property.type === "link") {
    return property.label ?? property.url;
  }
  return property.label ?? property.path;
};

const getEntryKind = (property: StringPropertyValue): (typeof entries)[number]["name"] => {
  if (property.type === "string") {
    const definition = entries.find((entry) => entry.name === property.value);

    if (definition) {
      return definition.name;
    }
  }

  throw new Error(`Invalid entry kind: ${property.raw}`);
};

const list = note("list", {
  listOf: p.text(),
});

const listIndex = note("listOfLists", {
  limitPer: p.number().optional(),
  lists: p.list(),
});

const grid = note("grid", {
  gridOf: p.text(),
});

const model = defineSchema({
  default: page,
  discriminator: "type",
  notes: [
    page,
    post,
    project,
    place,
    thing,
    grid,
    list,
    listIndex,
  ],
  routing: {
    permalink: webPermalink,
  },
});

const schema = model.render({
  grid: async ({ note: current, query }) => {
    const resolvedEntries = await query.findMany({
      folder: current.folder,
      kind: getEntryKind(current.properties.gridOf),
      orderBy: ({ properties }) => desc(properties.date),
    });
    const title = current.folder.vaultPath.split("/").at(-1) || current.name;

    return (
      <Page title={title}>
        <div className="grid grid-cols-2 gap-4 w-full">
          {resolvedEntries.map((entry) => {
            if (entry.kind === "project") {
              const entryTitle = entry.properties.title?.raw ?? entry.name;

              return (
                <Link
                  className="col-span-1 border border-transparent group hover:border-black cursor-pointer"
                  href={entry.webPath}
                  key={entry.webPath}
                >
                  <div className="border">
                    <div className="w-full h-32 relative bg-neutral-300">
                      <div
                        aria-hidden="true"
                        className="size-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${entry.properties.image.url}")`,
                        }}
                      />
                      <h3 className="absolute bottom-0 left-0 px-2 py-1 bg-black text-white font-semibold font-stretch-semi-condensed">
                        {entryTitle}
                      </h3>
                    </div>
                    <div className="flex flex-col items-start gap-1 p-2">
                      <span className="font-serif">{renderText(entry.properties.byline)}</span>
                    </div>
                  </div>
                </Link>
              );
            }
            return null;
          })}
        </div>
      </Page>
    );
  },
  list: async ({ note: current, query }) => {
    const resolvedEntries = await query.findMany({
      folder: current.folder,
      kind: getEntryKind(current.properties.listOf),
      orderBy: ({ properties }) => desc(properties.date),
    });
    const title = current.folder.vaultPath.split("/").at(-1) || current.name;

    return (
      <Page title={title}>
        <List className="mt-6">
          {resolvedEntries.map((entry) => {
            let decoration: ReactNode = format("do LLL y", entry.properties.date);

            if (entry.kind === "place") {
              decoration =
                entry.properties.rating === undefined ? (
                  "No rating"
                ) : (
                  <StarRating className="py-0.5" value={entry.properties.rating} />
                );
            }

            return (
              <ListItem
                decoration={decoration}
                href={entry.webPath}
                key={entry.webPath}
                title={
                  entry.kind === "post" && entry.properties.title
                    ? renderText(entry.properties.title)
                    : entry.name
                }
              />
            );
          })}
        </List>
      </Page>
    );
  },
  listOfLists: async ({ note: current, query }) => {
    const title = current.folder.vaultPath.split("/").at(-1) || current.name;

    const groups = await Promise.all(
      current.properties.lists.map(async (reference) => {
        if (reference.type !== "note") {
          throw new Error(`Expected a note link, received: ${reference.raw}`);
        }

        const index = await query.resolveOrThrow(reference);

        if (index.kind !== "list") {
          throw new Error(`Expected a list note, resolved: ${index.kind}`);
        }

        const resolvedEntries = await query.findMany({
          folder: index.folder,
          kind: getEntryKind(index.properties.listOf),
          limit: current.properties.limitPer,
          orderBy: ({ properties }) => desc(properties.date),
        });

        return {
          entries: resolvedEntries,
          index,
        };
      }),
    );

    return (
      <Page className="gap-5" title={title}>
        {groups.map((group) => {
          const listTitle = group.index.folder.vaultPath.split("/").at(-1) || group.index.name;

          return (
            <div className="w-full flex flex-col items-start gap-3" key={group.index.webPath}>
              <Link className="underline" href={group.index.webPath}>
                <h2 className="font-semibold text-xl">{listTitle}</h2>
              </Link>
              <List>
                {group.entries.map((entry) => {
                  const decoration = (() => {
                    if ("rating" in entry.properties && entry.properties.rating !== undefined) {
                      return <StarRating className="py-0.5" value={entry.properties.rating} />;
                    }
                    return null;
                  })();
                  return (
                    <ListItem
                      decoration={decoration}
                      href={entry.webPath}
                      key={entry.webPath}
                      title={entry.name}
                    />
                  );
                })}
              </List>
            </div>
          );
        })}
      </Page>
    );
  },
  page: ({ note: current }) => <VaultMarkdown note={current} />,
  place: ({ note: current }) => (
    <Page
      subtitle={
        current.properties.rating !== undefined && (
          <div className="bg-neutral-200 text-black py-1 px-2">
            <StarRating className="text-xl" value={current.properties.rating} />
          </div>
        )
      }
      title={current.name}
    >
      <VaultMarkdown note={current} />
    </Page>
  ),
  post: async ({ note: current, query }) => {
    const [parent] = await query.findMany({
      folder: current.folder,
      kind: "list",
      limit: 1,
    });

    if (!parent) {
      throw new Error(`Missing post list for ${current.folder.vaultPath}`);
    }

    return (
      <Page
        backNavigation={{
          href: parent.webPath,
          title: "Posts",
        }}
        subtitle={format("do MMMM y", current.properties.date)}
        title={current.properties.title ? renderText(current.properties.title) : current.name}
      >
        <VaultMarkdown note={current} />
      </Page>
    );
  },
  project: async ({ note: current, query }) => {
    const [parent] = await query.findMany({
      folder: current.folder,
      kind: "grid",
      limit: 1,
    });

    if (!parent) {
      throw new Error(`Missing project grid for ${current.folder.vaultPath}`);
    }

    const parentTitle = current.folder.vaultPath.split("/").at(-1) || parent.name;

    return (
      <Page
        backNavigation={{
          href: parent.webPath,
          title: parentTitle,
        }}
        subtitle={renderText(current.properties.byline)}
        title={current.properties.title ? renderText(current.properties.title) : current.name}
      >
        <OmniLink className="mt-2" query={query} value={current.properties.link} />
        <VaultMarkdown note={current} />
      </Page>
    );
  },
  thing: async ({ note: current, query }) => (
    <Page
      subtitle={<OmniLink query={query} value={current.properties.from} />}
      title={current.name}
    >
      <VaultMarkdown note={current} />
    </Page>
  ),
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

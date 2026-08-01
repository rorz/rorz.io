import { format } from "date-fns/fp";
import Link from "next/link";
import { ObsidianMarkdown } from "obsid/react";
import { defineSchema, desc, note, p } from "obsid/schema";
import type { StringPropertyValue } from "obsid/types";
import type { ReactNode } from "react";
import { List, ListItem } from "@/components/list/index.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
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

const entries = [
  post,
  place,
  thing,
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

  throw new Error(`Invalid list entry kind: ${property.raw}`);
};

const list = note("list", {
  listOf: p.text(),
});

const listIndex = note("listOfLists", {
  limitPer: p.number().optional(),
  lists: p.list(),
});

const model = defineSchema({
  default: page,
  discriminator: "type",
  notes: [
    page,
    post,
    place,
    thing,
    list,
    listIndex,
  ],
  routing: {
    permalink: webPermalink,
  },
});

const schema = model.render({
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
      <Page title={current.name}>
        {groups.map((group) => (
          <List key={group.index.webPath}>
            <p>{group.entries.length}</p>
          </List>
        ))}
      </Page>
    );
  },
  page: ({ note: current }) => <ObsidianMarkdown>{current.body}</ObsidianMarkdown>,
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
      <ObsidianMarkdown>{current.body}</ObsidianMarkdown>
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
        <ObsidianMarkdown>{current.body}</ObsidianMarkdown>
      </Page>
    );
  },
  thing: async ({ note: current, query }) => {
    const link = await (async () => {
      const { from } = current.properties;
      if (from.type === "note") {
        const note = await query.resolve(from);
        if (note === null) {
          return <p>No Note</p>;
        }
        return <Link href={note.webPath}>{note.name}</Link>;
      }
      return <p>NOT SUPPORTED YET</p>;
    })();
    return (
      <Page subtitle={link} title={current.name}>
        <ObsidianMarkdown>{current.body}</ObsidianMarkdown>
      </Page>
    );
  },
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

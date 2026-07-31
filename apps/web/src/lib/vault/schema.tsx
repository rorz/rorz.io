import { format } from "date-fns/fp";
import { ObsidianMarkdown } from "obsid/react";
import { defineSchema, desc, note, p } from "obsid/schema";
import type { ReactNode } from "react";
import { List, ListItem } from "@/components/list/index.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { webPermalink } from "@/lib/vault/routing.ts";

const dated = {
  date: p.date(),
};
const titled = {
  title: p.string().optional(),
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
  from: p.string(),
});

const entries = [
  post,
  place,
  thing,
] as const;

const list = note("list", {
  listOf: p.kind(...entries),
});

const listIndex = note("listOfLists", {
  limitPer: p.number().optional(),
  lists: p.ref(list).array(),
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
      kind: current.data.listOf,
      orderBy: ({ data }) => desc(data.date),
    });
    const title = current.folder.vaultPath.split("/").at(-1) || current.name;

    return (
      <Page title={title}>
        <List className="mt-6">
          {resolvedEntries.map((entry) => {
            let decoration: ReactNode = format("do LLL y", entry.data.date);

            if (entry.kind === "place") {
              decoration =
                entry.data.rating === undefined ? (
                  "No rating"
                ) : (
                  <StarRating className="py-0.5" value={entry.data.rating} />
                );
            }

            return (
              <ListItem
                decoration={decoration}
                href={entry.webPath}
                key={entry.webPath}
                title={entry.kind === "post" ? (entry.data.title ?? entry.name) : entry.name}
              />
            );
          })}
        </List>
      </Page>
    );
  },
  listOfLists: async ({ note: current, query }) => {
    const groups = await Promise.all(
      current.data.lists.map(async (reference) => {
        const index = await query.resolveOrThrow(reference);
        const resolvedEntries = await query.findMany({
          folder: index.folder,
          kind: index.data.listOf,
          limit: current.data.limitPer,
          orderBy: ({ data }) => desc(data.date),
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
        current.data.rating !== undefined && (
          <div className="bg-neutral-200 text-black py-1 px-2">
            <StarRating className="text-xl" value={current.data.rating} />
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
        subtitle={format("do MMMM y", current.data.date)}
        title={current.data.title ?? current.name}
      >
        <ObsidianMarkdown>{current.body}</ObsidianMarkdown>
      </Page>
    );
  },
  thing: ({ note: current }) => (
    <Page title={current.name}>
      <ObsidianMarkdown>{current.body}</ObsidianMarkdown>
    </Page>
  ),
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

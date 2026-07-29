import { format } from "date-fns/fp";
import { date, list, number, text } from "obsid/property";
import { ObsidianMarkdown } from "obsid/react";
import { defineObsidSchema } from "obsid/schema";
import type { StringPropertyValue } from "obsid/types";
import type { ReactNode } from "react";
import z from "zod";
import { List, ListItem } from "@/components/list/index.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { webPermalink } from "@/lib/vault/routing.ts";

const renderTitle = (title: StringPropertyValue | undefined): string | null => {
  if (!title) {
    return null;
  }

  if (title.type === "string") {
    return title.value;
  }

  if (title.type === "link") {
    return title.label ?? title.url;
  }

  return title.label ?? title.path;
};

const getNoteTitle = (vaultPath: string, title?: StringPropertyValue): string =>
  renderTitle(title) ?? vaultPath.slice(vaultPath.lastIndexOf("/") + 1);

const schema = defineObsidSchema({
  defaultType: "page",
  // globalProperties: { ... }
  // globalMetadata: { ... }
  registry: {
    list: {
      properties: {
        listOf: text(),
        sortKey: text().optional(),
      },
      renderer: async (properties, { resolveFolder, currentFolder, sortBy }) => {
        const listTitle = getNoteTitle(currentFolder.vaultPath);

        const listOf = z
          .enum([
            "post",
            "place",
            "thing",
          ])
          .parse(properties.listOf.raw);

        const notes = await resolveFolder(currentFolder, listOf);

        const sorted = (() => {
          if (listOf === "place") {
            return sortBy(notes, "date");
          }
          if (listOf === "post") {
            return sortBy(notes, "date");
          }
          if (listOf === "thing") {
            return sortBy(notes, "date");
          }

          return notes;
        })();

        return (
          <Page title={`${listTitle} (All)`}>
            <List className="mt-6">
              {sorted.map((note) => {
                let title = "No title";
                let decoration: string | ReactNode = "No decoration";

                if (note.pageType === "post") {
                  title = getNoteTitle(note.vaultPath, note.properties.title);
                  decoration = format("do LLL y", note.properties.date);
                }
                if (note.pageType === "place") {
                  title = getNoteTitle(note.vaultPath);
                  decoration = note.properties.rating ? (
                    <StarRating className="py-0.5" value={note.properties.rating} />
                  ) : (
                    "No rating"
                  );
                }
                if (note.pageType === "thing") {
                  title = getNoteTitle(note.vaultPath);
                  decoration = format("do LLL y", note.properties.date);
                }

                return (
                  <ListItem
                    decoration={decoration}
                    href={note.webPath}
                    key={note.webPath}
                    title={title}
                  />
                );
              })}
            </List>
          </Page>
        );
      },
    },
    listOfLists: {
      properties: {
        limitPer: number().optional(),
        lists: list(),
      },
      renderer: async (properties, { title, markdown, ...tools }) => {
        console.log("STARTING LIST OF LISTS RENDER");
        const lists = await Promise.all(
          z
            .array(
              z.object({
                label: z.string(),
                path: z.string(),
                type: z.literal("note"),
              }),
            )
            .parse(properties.lists)
            .map(async (listDefinition) => {
              console.log("LIST DEFINITION", listDefinition);
              const folderPath = listDefinition.path.split("/").slice(0, -1).join("/");
              const indexNotePath = listDefinition.path;
              const [indexNote] = await tools.resolveFolder(
                {
                  kind: "folder",
                  vaultPath: folderPath,
                },
                "list",
              );

              if (indexNote === undefined) {
                throw new Error(`Can't find an index note at ${folderPath}`);
              }

              const listOf = z
                .enum([
                  "thing",
                  "place",
                ])
                .parse(indexNote.properties.listOf.raw);

              const title = getNoteTitle(folderPath);
              const notes = await tools.resolveFolder(
                {
                  kind: "folder",
                  vaultPath: folderPath,
                },
                listOf,
              );
              console.log("GOT NOTES: Count::", notes.length);
              return {
                notes: notes.slice(0, properties.limitPer ?? notes.length - 1),
                title,
              };
            }),
        );
        return (
          <Page title={title}>
            {lists.map((list) => (
              <List key={list.title}>
                <p>{list.notes.length}</p>
              </List>
            ))}
          </Page>
        );
      },
    },
    page: {
      properties: {
        slug: text().optional(),
        title: text().optional(),
      },
      renderer: (_properties, { markdown }) => <ObsidianMarkdown>{markdown}</ObsidianMarkdown>,
      // metadata: { //example
      //   title: "title",
      //   slug: "slug"
      // }
    },
    place: {
      properties: {
        date: date(),
        rating: number().optional(),
      },
      renderer: (properties, { markdown, title }) => (
        <Page
          subtitle={
            properties.rating && (
              <div className="bg-neutral-200 text-black py-1 px-2">
                <StarRating className="text-xl" value={properties.rating} />
              </div>
            )
          }
          title={title}
        >
          <ObsidianMarkdown>{markdown}</ObsidianMarkdown>
        </Page>
      ),
    },
    post: {
      properties: {
        date: date(),
        title: text().optional(),
      },
      renderer: async (properties, { markdown, title, resolveFolder, currentFolder }) => {
        const notes = await resolveFolder(currentFolder);
        const parent = notes.find((note) => note.pageType === "list");
        if (parent === undefined) {
          throw new Error(`Missing post list for ${currentFolder.vaultPath}`);
        }
        return (
          <Page
            backNavigation={{
              href: parent.webPath,
              title: "Posts",
            }}
            subtitle={format("do MMMM y", properties.date)}
            title={title}
          >
            <ObsidianMarkdown>{markdown}</ObsidianMarkdown>
          </Page>
        );
      },
    },
    thing: {
      properties: {
        date: date(),
        from: text(),
      },
      renderer: (properties, { markdown, title }) => {
        //
        return (
          <Page title={title}>
            <ObsidianMarkdown>{markdown}</ObsidianMarkdown>
          </Page>
        );
      },
    },
  },
  routing: {
    permalink: webPermalink,
  },
  typeIdentifier: "type",
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

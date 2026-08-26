import { format } from "date-fns/fp";
import { desc } from "obsid/schema";
import type { ReactNode } from "react";
import { EntryNavigation } from "@/components/entry-navigation.tsx";
import { List, ListItem } from "@/components/list/index.tsx";
import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { SectionHeading } from "@/components/section-heading.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { getEntryNavigation } from "@/lib/vault/entry-navigation.ts";
import { getParentDirectoryNavigation } from "@/lib/vault/parent-directory.ts";
import {
  getEntryKind,
  getFolderTitle,
  renderText,
  type VaultEntry,
  type VaultRenderContext,
  type VaultRenderer,
  type VaultRenderers,
} from "@/lib/vault/schema/definitions.ts";

type ListContext = VaultRenderContext<"list">;

type ListEntryNote =
  | VaultRenderContext<"book">["note"]
  | VaultRenderContext<"film">["note"]
  | VaultRenderContext<"place">["note"]
  | VaultRenderContext<"post">["note"]
  | VaultRenderContext<"thing">["note"];

const getListEntryTitle = (entry: VaultEntry): string =>
  entry.kind === "post" && entry.properties.title ? renderText(entry.properties.title) : entry.name;

const findListEntries = (index: ListContext["note"], query: ListContext["query"]) =>
  query.findMany({
    folder: index.folder,
    kind: getEntryKind(index.properties.listOf),
    orderBy: ({ properties }) => desc(properties.date),
  });

const getListDecoration = (entry: VaultEntry): ReactNode => {
  if (entry.kind === "place") {
    if (entry.properties.rating === undefined) {
      return "No rating";
    }

    return <StarRating className="py-0.5" value={entry.properties.rating} />;
  }

  if (entry.kind === "film") {
    if (entry.properties.rating !== undefined) {
      return <StarRating className="py-0.5" value={entry.properties.rating} />;
    }

    if (entry.properties.date === undefined) {
      return null;
    }
  }

  if (entry.properties.date !== undefined) {
    return (
      <time dateTime={format("yyyy-MM-dd", entry.properties.date)}>
        {format("do LLL y", entry.properties.date)}
      </time>
    );
  }

  return null;
};

type ListIndexContext = VaultRenderContext<"listOfLists">;
type ListReference = ListIndexContext["note"]["properties"]["lists"][number];

const resolveListGroup = async (
  reference: ListReference,
  current: ListIndexContext["note"],
  query: ListIndexContext["query"],
) => {
  if (reference.type !== "note") {
    throw new Error(`Expected a note link, received: ${reference.raw}`);
  }

  const index = await query.resolveOrThrow(reference);

  if (index.kind !== "list") {
    throw new Error(`Expected a list note, resolved: ${index.kind}`);
  }

  const allEntries = await findListEntries(index, query);

  return {
    entries:
      current.properties.limitPer === undefined
        ? allEntries
        : allEntries.slice(0, current.properties.limitPer),
    index,
    totalCount: allEntries.length,
  };
};

type ListGroup = Awaited<ReturnType<typeof resolveListGroup>>;

const getRatingDecoration = (entry: VaultEntry) => {
  if ("rating" in entry.properties && entry.properties.rating !== undefined) {
    return <StarRating className="py-0.5" value={entry.properties.rating} />;
  }

  return null;
};

const renderListEntries = (
  entries: readonly VaultEntry[],
  getDecoration: (entry: VaultEntry) => ReactNode = getListDecoration,
) =>
  entries.map((entry) => (
    <ListItem
      decoration={getDecoration(entry)}
      href={entry.webPath}
      key={entry.webPath}
      title={getListEntryTitle(entry)}
    />
  ));

const renderListGroup = (
  group: ListGroup,
  title = getFolderTitle(group.index),
  getDecoration: (entry: VaultEntry) => ReactNode = getRatingDecoration,
) => (
  <div className="w-full flex flex-col items-start gap-3" key={group.index.webPath}>
    <SectionHeading count={group.totalCount} href={group.index.webPath} title={title} />
    <List>{renderListEntries(group.entries, getDecoration)}</List>
  </div>
);

const resolveListDetail = async (current: ListEntryNote, query: ListContext["query"]) => {
  const [parent] = await query.findMany({
    folder: current.folder,
    kind: "list",
    limit: 1,
  });

  if (!parent) {
    return {
      navigation: {},
    };
  }

  const entries = await findListEntries(parent, query);

  return {
    navigation: getEntryNavigation(entries, current.webPath, getListEntryTitle),
    parent,
  };
};

type RatedNote =
  | VaultRenderContext<"book">["note"]
  | VaultRenderContext<"film">["note"]
  | VaultRenderContext<"place">["note"];

const renderRatedPage = async (current: RatedNote, query: ListContext["query"]) => {
  const { navigation, parent } = await resolveListDetail(current, query);

  return (
    <Page
      {...(parent
        ? {
            backNavigation: {
              href: parent.webPath,
              title: getFolderTitle(current),
            },
          }
        : {})}
      subtitle={
        current.properties.rating !== undefined && (
          <div className="bg-zinc-300 dark:bg-zinc-700 py-1 px-2">
            <StarRating className="text-xl" value={current.properties.rating} />
          </div>
        )
      }
      title={current.name}
    >
      <VaultMarkdown note={current} />
      <EntryNavigation {...navigation} />
    </Page>
  );
};

const renderListSection = async (
  index: ListContext["note"],
  title: string,
  query: ListContext["query"],
) => {
  const entries = await findListEntries(index, query);

  return renderListGroup(
    {
      entries,
      index,
      totalCount: entries.length,
    },
    title,
    getListDecoration,
  );
};

const list: VaultRenderer<"list"> = async ({ note: current, query }) => {
  const [entries, backNavigation] = await Promise.all([
    findListEntries(current, query),
    getParentDirectoryNavigation(current, query),
  ]);

  return (
    <Page
      {...(backNavigation
        ? {
            backNavigation,
          }
        : {})}
      title={getFolderTitle(current)}
    >
      <List className="mt-6">{renderListEntries(entries)}</List>
    </Page>
  );
};

const listOfLists: VaultRenderer<"listOfLists"> = async ({ note: current, query }) => {
  const groups = await Promise.all(
    current.properties.lists.map((reference) => resolveListGroup(reference, current, query)),
  );

  return (
    <Page className="gap-5" title={getFolderTitle(current)}>
      {groups.map((group) => renderListGroup(group))}
    </Page>
  );
};

const post: VaultRenderer<"post"> = async ({ note: current, query }) => {
  const { navigation, parent } = await resolveListDetail(current, query);

  if (!parent) {
    throw new Error(`Missing post list for ${current.folder.vaultPath}`);
  }

  return (
    <Page
      as="article"
      backNavigation={{
        href: parent.webPath,
        title: "Posts",
      }}
      subtitle={
        <time dateTime={format("yyyy-MM-dd", current.properties.date)}>
          {format("do MMMM y", current.properties.date)}
        </time>
      }
      title={current.properties.title ? renderText(current.properties.title) : current.name}
    >
      <VaultMarkdown note={current} />
      <EntryNavigation {...navigation} />
    </Page>
  );
};

const book: VaultRenderer<"book"> = ({ note: current, query }) => renderRatedPage(current, query);

const film: VaultRenderer<"film"> = ({ note: current, query }) => renderRatedPage(current, query);

const place: VaultRenderer<"place"> = ({ note: current, query }) => renderRatedPage(current, query);

const thing: VaultRenderer<"thing"> = async ({ note: current, query }) => {
  const { navigation, parent } = await resolveListDetail(current, query);

  return (
    <Page
      {...(parent
        ? {
            backNavigation: {
              href: parent.webPath,
              title: getFolderTitle(current),
            },
          }
        : {})}
      subtitle={<OmniLink query={query} value={current.properties.from} />}
      title={current.name}
    >
      <VaultMarkdown note={current} />
      <EntryNavigation {...navigation} />
    </Page>
  );
};

const listRenderers = {
  book,
  film,
  list,
  listOfLists,
  place,
  post,
  thing,
} satisfies Pick<
  VaultRenderers,
  "book" | "film" | "list" | "listOfLists" | "place" | "post" | "thing"
>;

export { listRenderers, renderListSection };

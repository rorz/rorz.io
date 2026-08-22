import { format } from "date-fns/fp";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import { desc } from "obsid/schema";
import type { ReactNode } from "react";
import { List, ListItem } from "@/components/list/index.tsx";
import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
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

const getListDecoration = (entry: VaultEntry): ReactNode => {
  if (entry.kind !== "place") {
    return format("do LLL y", entry.properties.date);
  }

  if (entry.properties.rating === undefined) {
    return "No rating";
  }

  return <StarRating className="py-0.5" value={entry.properties.rating} />;
};

const renderListEntry = (entry: VaultEntry) => (
  <ListItem
    decoration={getListDecoration(entry)}
    href={entry.webPath}
    key={entry.webPath}
    title={
      entry.kind === "post" && entry.properties.title
        ? renderText(entry.properties.title)
        : entry.name
    }
  />
);

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

  const entries = await query.findMany({
    folder: index.folder,
    kind: getEntryKind(index.properties.listOf),
    limit: current.properties.limitPer,
    orderBy: ({ properties }) => desc(properties.date),
  });

  return {
    entries,
    index,
  };
};

type ListGroup = Awaited<ReturnType<typeof resolveListGroup>>;

const getRatingDecoration = (entry: VaultEntry) => {
  if ("rating" in entry.properties && entry.properties.rating !== undefined) {
    return <StarRating className="py-0.5" value={entry.properties.rating} />;
  }

  return null;
};

const renderListGroup = (group: ListGroup, title = getFolderTitle(group.index)) => (
  <div className="w-full flex flex-col items-start gap-3" key={group.index.webPath}>
    <Link className="underline" href={group.index.webPath}>
      <h2 className="font-semibold text-xl">{title}</h2>
    </Link>
    <List>
      {group.entries.map((entry) => (
        <ListItem
          decoration={getRatingDecoration(entry)}
          href={entry.webPath}
          key={entry.webPath}
          title={entry.name}
        />
      ))}
    </List>
  </div>
);

type ListContext = VaultRenderContext<"list">;

type ListEntryNote =
  | VaultRenderContext<"book">["note"]
  | VaultRenderContext<"place">["note"]
  | VaultRenderContext<"thing">["note"];

const getListEntryNavigation = async (current: ListEntryNote, query: ListContext["query"]) => {
  const [parent] = await query.findMany({
    folder: current.folder,
    kind: "list",
    limit: 1,
  });

  return parent
    ? {
        href: parent.webPath,
        title: getFolderTitle(current),
      }
    : undefined;
};

type RatedNote = VaultRenderContext<"book">["note"] | VaultRenderContext<"place">["note"];

const renderRatedPage = async (current: RatedNote, query: ListContext["query"]) => {
  const backNavigation = await getListEntryNavigation(current, query);

  return (
    <Page
      {...(backNavigation
        ? {
            backNavigation,
          }
        : {})}
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
  );
};

const renderListSection = async (
  index: ListContext["note"],
  title: string,
  query: ListContext["query"],
) => {
  const entries = await query.findMany({
    folder: index.folder,
    kind: getEntryKind(index.properties.listOf),
    orderBy: ({ properties }) => desc(properties.date),
  });

  return renderListGroup(
    {
      entries,
      index,
    },
    title,
  );
};

const list: VaultRenderer<"list"> = async ({ note: current, query }) => {
  const [entries, backNavigation] = await Promise.all([
    query.findMany({
      folder: current.folder,
      kind: getEntryKind(current.properties.listOf),
      orderBy: ({ properties }) => desc(properties.date),
    }),
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
      <List className="mt-6">{entries.map(renderListEntry)}</List>
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
};

const book: VaultRenderer<"book"> = ({ note: current, query }) => renderRatedPage(current, query);

const place: VaultRenderer<"place"> = ({ note: current, query }) => renderRatedPage(current, query);

const thing: VaultRenderer<"thing"> = async ({ note: current, query }) => {
  const backNavigation = await getListEntryNavigation(current, query);

  return (
    <Page
      {...(backNavigation
        ? {
            backNavigation,
          }
        : {})}
      subtitle={<OmniLink query={query} value={current.properties.from} />}
      title={current.name}
    >
      <VaultMarkdown note={current} />
    </Page>
  );
};

const listRenderers = {
  book,
  list,
  listOfLists,
  place,
  post,
  thing,
} satisfies Pick<VaultRenderers, "book" | "list" | "listOfLists" | "place" | "post" | "thing">;

export { listRenderers, renderListSection };

import { getEntryNavigation } from "@/lib/vault/entry-navigation.ts";
import {
  getCollectionEntryKinds,
  type VaultEntry,
  type VaultRenderContext,
} from "@/lib/vault/schema/definitions.ts";

type GridContext = VaultRenderContext<"grid">;

type CollectionEntryNote =
  | VaultRenderContext<"image">["note"]
  | VaultRenderContext<"project">["note"]
  | VaultRenderContext<"video">["note"];

interface CollectionDetail {
  readonly navigation: {
    readonly next?: {
      readonly href: string;
      readonly title: string;
    };
    readonly previous?: {
      readonly href: string;
      readonly title: string;
    };
  };
  readonly parent?: GridContext["note"];
}

const getCollectionEntryTitle = (entry: VaultEntry): string =>
  entry.kind === "project" ? (entry.properties.title?.raw ?? entry.name) : entry.name;

const compareCollectionEntryDates = (left: VaultEntry, right: VaultEntry): number =>
  (right.properties.date?.getTime() ?? 0) - (left.properties.date?.getTime() ?? 0);

const sortCollectionPreviewEntries = (entries: readonly VaultEntry[]): readonly VaultEntry[] =>
  entries.toSorted((left, right) => {
    const leftRank = left.properties.previewRank;
    const rightRank = right.properties.previewRank;

    if (leftRank === undefined && rightRank !== undefined) {
      return 1;
    }

    if (leftRank !== undefined && rightRank === undefined) {
      return -1;
    }

    if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return compareCollectionEntryDates(left, right);
  });

const findCollectionEntries = async (
  folder: GridContext["note"]["folder"],
  property: GridContext["note"]["properties"]["gridOf"],
  query: GridContext["query"],
) => {
  const entryGroups = await Promise.all(
    getCollectionEntryKinds(property).map((kind) =>
      query.findMany({
        folder,
        kind,
      }),
    ),
  );

  return entryGroups.flat().toSorted(compareCollectionEntryDates);
};

const resolveCollectionDetail = async (
  current: CollectionEntryNote,
  query: GridContext["query"],
): Promise<CollectionDetail> => {
  const [parent] = await query.findMany({
    folder: current.folder,
    kind: "grid",
    limit: 1,
  });

  if (!parent) {
    return {
      navigation: {},
    };
  }

  const entries = await findCollectionEntries(parent.folder, parent.properties.gridOf, query);

  return {
    navigation: getEntryNavigation(entries, current.webPath, getCollectionEntryTitle),
    parent,
  };
};

export {
  findCollectionEntries,
  getCollectionEntryTitle,
  resolveCollectionDetail,
  sortCollectionPreviewEntries,
};

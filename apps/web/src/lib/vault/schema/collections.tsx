import { format } from "date-fns/fp";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Image from "next/image";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import { CollectionGrid, CollectionGridItem } from "@/components/collection-grid.tsx";
import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { getParentDirectoryNavigation } from "@/lib/vault/parent-directory.ts";
import {
  getCollectionEntryKinds,
  getFolderTitle,
  renderText,
  type VaultEntry,
  type VaultRenderContext,
  type VaultRenderer,
  type VaultRenderers,
} from "@/lib/vault/schema/definitions.ts";

const renderCollectionEntry = (entry: VaultEntry) => {
  if (entry.kind === "project") {
    return (
      <CollectionGridItem
        description={renderText(entry.properties.byline)}
        href={entry.webPath}
        imageAlt=""
        imageSrc={entry.properties.image.url}
        key={entry.webPath}
        title={entry.properties.title?.raw ?? entry.name}
      />
    );
  }

  if (entry.kind === "image" && entry.properties.src) {
    return (
      <CollectionGridItem
        href={entry.webPath}
        imageAlt=""
        imageSrc={entry.properties.src.url}
        key={entry.webPath}
        title={entry.name}
        variant="icon"
      />
    );
  }

  if (entry.kind === "video") {
    return (
      <CollectionGridItem
        href={entry.webPath}
        imageAlt=""
        imageSrc={entry.properties.thumbnail.url}
        key={entry.webPath}
        thumbnailKind="video"
        title={entry.name}
        variant="icon"
      />
    );
  }

  return null;
};

type GridContext = VaultRenderContext<"grid">;

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

  return entryGroups
    .flat()
    .toSorted((left, right) => right.properties.date.getTime() - left.properties.date.getTime());
};

type GridIndexContext = VaultRenderContext<"gridOfGrids">;
type GridReference = GridIndexContext["note"]["properties"]["grids"][number];

const resolveGridGroup = async (reference: GridReference, query: GridIndexContext["query"]) => {
  if (reference.type !== "note") {
    throw new Error(`Expected a note link, received: ${reference.raw}`);
  }

  const index = await query.resolveOrThrow(reference);

  if (index.kind !== "grid") {
    throw new Error(`Expected a grid note, resolved: ${index.kind}`);
  }

  const entries = await findCollectionEntries(index.folder, index.properties.gridOf, query);

  return {
    entries,
    index,
    title: reference.label ?? getFolderTitle(index),
  };
};

type GridGroup = Awaited<ReturnType<typeof resolveGridGroup>>;

const renderCollectionSection = (group: GridGroup) => (
  <section className="w-full flex flex-col items-start gap-3" key={group.index.webPath}>
    <Link className="underline" href={group.index.webPath}>
      <h2 className="font-semibold text-xl">{group.title}</h2>
    </Link>
    <CollectionGrid layout="row">{group.entries.map(renderCollectionEntry)}</CollectionGrid>
  </section>
);

const renderImageView = (name: string, source: string) => (
  <a
    aria-label={`Open ${name} at full size`}
    className="block w-fit max-w-full bg-neutral-100 dark:bg-zinc-800"
    href={source}
    rel="noopener"
    target="_blank"
  >
    <Image alt={name} className="block max-w-full h-auto" src={source} unoptimized={true} />
  </a>
);

const renderVideoView = (name: string, source: string) => (
  <>
    {/* biome-ignore lint/a11y/useMediaCaption: Vault videos may be silent or include captions in the source. */}
    <video
      aria-label={name}
      className="block max-w-full h-auto bg-black"
      controls={true}
      playsInline={true}
      preload="metadata"
      src={source}
    />
  </>
);

const grid: VaultRenderer<"grid"> = async ({ note: current, query }) => {
  const [entries, backNavigation] = await Promise.all([
    findCollectionEntries(current.folder, current.properties.gridOf, query),
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
      <CollectionGrid>{entries.map(renderCollectionEntry)}</CollectionGrid>
    </Page>
  );
};

const gridOfGrids: VaultRenderer<"gridOfGrids"> = async ({ note: current, query }) => {
  const groups = await Promise.all(
    current.properties.grids.map((reference) => resolveGridGroup(reference, query)),
  );

  return (
    <Page className="gap-6" title={getFolderTitle(current)}>
      {groups.map(renderCollectionSection)}
    </Page>
  );
};

const image: VaultRenderer<"image"> = async ({ note: current, query }) => {
  const [parent] = await query.findMany({
    folder: current.folder,
    kind: "grid",
    limit: 1,
  });
  const source = current.properties.src?.url;

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
      subtitle={format("do MMMM y", current.properties.date)}
      title={current.name}
    >
      {source ? renderImageView(current.name, source) : null}
      <VaultMarkdown note={current} />
    </Page>
  );
};

const project: VaultRenderer<"project"> = async ({ note: current, query }) => {
  const [parent] = await query.findMany({
    folder: current.folder,
    kind: "grid",
    limit: 1,
  });

  if (!parent) {
    throw new Error(`Missing project grid for ${current.folder.vaultPath}`);
  }

  return (
    <Page
      backNavigation={{
        href: parent.webPath,
        title: getFolderTitle(current),
      }}
      subtitle={renderText(current.properties.byline)}
      title={current.properties.title ? renderText(current.properties.title) : current.name}
    >
      <OmniLink className="mt-2" query={query} value={current.properties.link} />
      <VaultMarkdown note={current} />
    </Page>
  );
};

const video: VaultRenderer<"video"> = async ({ note: current, query }) => {
  const [parent] = await query.findMany({
    folder: current.folder,
    kind: "grid",
    limit: 1,
  });
  const source = current.properties.src?.url;

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
      subtitle={format("do MMMM y", current.properties.date)}
      title={current.name}
    >
      {source ? renderVideoView(current.name, source) : null}
      <VaultMarkdown note={current} />
    </Page>
  );
};

const collectionRenderers = {
  grid,
  gridOfGrids,
  image,
  project,
  video,
} satisfies Pick<VaultRenderers, "grid" | "gridOfGrids" | "image" | "project" | "video">;

export { collectionRenderers };

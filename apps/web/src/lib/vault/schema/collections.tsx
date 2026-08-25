import { format } from "date-fns/fp";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Image from "next/image";
import { CollectionGrid, CollectionGridItem } from "@/components/collection-grid.tsx";
import { EntryNavigation } from "@/components/entry-navigation.tsx";
import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { ResponsiveThumbnail } from "@/components/responsive-thumbnail.tsx";
import { SectionHeading } from "@/components/section-heading.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { getParentDirectoryNavigation } from "@/lib/vault/parent-directory.ts";
import {
  findCollectionEntries,
  getCollectionEntryTitle,
  resolveCollectionDetail,
} from "@/lib/vault/schema/collections-data.ts";
import {
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
        kind="card"
        title={getCollectionEntryTitle(entry)}
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
        kind="image"
        title={entry.name}
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
        kind="video"
        title={entry.name}
      />
    );
  }

  return null;
};

type GridContext = VaultRenderContext<"grid">;

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
    <SectionHeading count={group.entries.length} href={group.index.webPath} title={group.title} />
    <CollectionGrid layout="row">{group.entries.map(renderCollectionEntry)}</CollectionGrid>
  </section>
);

const renderGridSection = async (
  index: GridContext["note"],
  title: string,
  query: GridContext["query"],
) =>
  renderCollectionSection({
    entries: await findCollectionEntries(index.folder, index.properties.gridOf, query),
    index,
    title,
  });

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
  const { navigation, parent } = await resolveCollectionDetail(current, query);
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
      <EntryNavigation {...navigation} />
    </Page>
  );
};

const project: VaultRenderer<"project"> = async ({ note: current, query }) => {
  const { navigation, parent } = await resolveCollectionDetail(current, query);

  if (!parent) {
    throw new Error(`Missing project grid for ${current.folder.vaultPath}`);
  }

  return (
    <Page
      backNavigation={{
        href: parent.webPath,
        title: getFolderTitle(current),
      }}
      subtitle={
        <div className="mb-4 flex flex-col items-start gap-2">
          <span className="text-neutral-700">{renderText(current.properties.byline)}</span>
          <OmniLink query={query} value={current.properties.link} />
        </div>
      }
      title={current.properties.title ? renderText(current.properties.title) : current.name}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-300 dark:bg-zinc-700">
        <ResponsiveThumbnail
          alt=""
          loading="eager"
          source={current.properties.image.url}
          variant="detail"
        />
      </div>
      <VaultMarkdown note={current} />
      <EntryNavigation {...navigation} />
    </Page>
  );
};

const video: VaultRenderer<"video"> = async ({ note: current, query }) => {
  const { navigation, parent } = await resolveCollectionDetail(current, query);
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
      <EntryNavigation {...navigation} />
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

export { collectionRenderers, renderGridSection };

import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { collectionRenderers, renderGridSection } from "@/lib/vault/schema/collections.tsx";
import {
  getFolderTitle,
  model,
  type VaultRenderContext,
  type VaultRenderers,
} from "@/lib/vault/schema/definitions.ts";
import { listRenderers, renderListSection } from "@/lib/vault/schema/lists.tsx";

type IndexContext = VaultRenderContext<"index">;
type SectionReference = IndexContext["note"]["properties"]["sections"][number];

const renderIndexSection = async (reference: SectionReference, query: IndexContext["query"]) => {
  if (reference.type !== "note") {
    throw new Error(`Expected a note link, received: ${reference.raw}`);
  }

  const section = await query.resolveOrThrow(reference);

  if (section.kind === "list") {
    return renderListSection(section, reference.label ?? getFolderTitle(section), query);
  }

  if (section.kind === "grid") {
    return renderGridSection(section, reference.label ?? getFolderTitle(section), query);
  }

  throw new Error(`Expected a list or grid note, resolved: ${section.kind}`);
};

const index: VaultRenderers["index"] = async ({ note: current, query }) => (
  <Page className="gap-6">
    {
      await Promise.all(
        current.properties.sections.map((reference) => renderIndexSection(reference, query)),
      )
    }
  </Page>
);

type RatedNote = VaultRenderContext<"book">["note"] | VaultRenderContext<"place">["note"];

const renderRatedPage = (current: RatedNote) => (
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
);

const simpleRenderers = {
  book: ({ note: current }) => renderRatedPage(current),
  page: ({ note: current }) => <VaultMarkdown note={current} />,
  place: ({ note: current }) => renderRatedPage(current),
  thing: ({ note: current, query }) => (
    <Page
      subtitle={<OmniLink query={query} value={current.properties.from} />}
      title={current.name}
    >
      <VaultMarkdown note={current} />
    </Page>
  ),
} satisfies Pick<VaultRenderers, "book" | "page" | "place" | "thing">;

const schema = model.render({
  ...collectionRenderers,
  ...listRenderers,
  ...simpleRenderers,
  index,
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

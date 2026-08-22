import { Page } from "@/components/page.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { collectionRenderers, renderGridSection } from "@/lib/vault/schema/collections.tsx";
import {
  getFolderTitle,
  model,
  renderText,
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

const simpleRenderers = {
  page: ({ note: current }) =>
    current.properties.title ? (
      <Page title={renderText(current.properties.title)}>
        <VaultMarkdown note={current} />
      </Page>
    ) : (
      <VaultMarkdown note={current} />
    ),
} satisfies Pick<VaultRenderers, "page">;

const schema = model.render({
  ...collectionRenderers,
  ...listRenderers,
  ...simpleRenderers,
  index,
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

import { OmniLink } from "@/components/omni-link.tsx";
import { Page } from "@/components/page.tsx";
import { StarRating } from "@/components/star-rating.tsx";
import { VaultMarkdown } from "@/components/vault-markdown.tsx";
import { collectionRenderers } from "@/lib/vault/schema/collections.tsx";
import {
  model,
  type VaultRenderContext,
  type VaultRenderers,
} from "@/lib/vault/schema/definitions.ts";
import { listRenderers } from "@/lib/vault/schema/lists.tsx";

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
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

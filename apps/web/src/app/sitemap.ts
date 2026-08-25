// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import type { MetadataRoute } from "next";
import {
  getFrontmatterString,
  getNoteDescription,
  getNoteImage,
  getNoteModifiedAt,
  getNotePublishedAt,
  getNoteTitle,
} from "@/lib/seo/content.ts";
import { getAbsoluteUrl } from "@/lib/seo/site.ts";
import { getIndexableSiteEntries } from "@/lib/seo/site-content.ts";

const sitemap = async (): Promise<MetadataRoute.Sitemap> =>
  (await getIndexableSiteEntries()).map(({ note, route }) => {
    const description = getNoteDescription(note);
    const image = getNoteImage(note);
    const lastModified = getNoteModifiedAt(note) ?? undefined;
    const source = getFrontmatterString(note, "src");
    const video =
      note.kind === "video" && description && image && source
        ? {
            // biome-ignore lint/style/useNamingConvention: Video sitemap fields follow Google's XML schema.
            content_loc: getAbsoluteUrl(source),
            description,
            // biome-ignore lint/style/useNamingConvention: Video sitemap fields follow Google's XML schema.
            publication_date: getNotePublishedAt(note)?.toISOString(),
            // biome-ignore lint/style/useNamingConvention: Video sitemap fields follow Google's XML schema.
            thumbnail_loc: image,
            title: getNoteTitle(note),
          }
        : null;

    return {
      ...(image && note.kind !== "video"
        ? {
            images: [
              image,
            ],
          }
        : {}),
      ...(lastModified
        ? {
            lastModified,
          }
        : {}),
      ...(video
        ? {
            videos: [
              video,
            ],
          }
        : {}),
      url: getAbsoluteUrl(route.webPath),
    };
  });

export default sitemap;

import { getNoteDescription, getNotePublishedAt, getNoteTitle } from "@/lib/seo/content.ts";
import { getAbsoluteUrl, SITE_LANGUAGE, SITE_NAME, WRITING_FEED_PATH } from "@/lib/seo/site.ts";
import { getWritingPosts } from "@/lib/seo/site-content.ts";
import { vault } from "@/lib/vault/index.ts";

interface RssItem {
  readonly description: string | null;
  readonly publishedAt: Date;
  readonly title: string;
  readonly url: string;
}

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const renderItem = (item: RssItem): string => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${item.publishedAt.toUTCString()}</pubDate>
${item.description ? `      <description>${escapeXml(item.description)}</description>\n` : ""}    </item>`;

const renderFeed = (title: string, description: string, items: readonly RssItem[]): string => {
  const latestTimestamp = Math.max(...items.map((item) => item.publishedAt.getTime()));
  const lastBuildDate = Number.isFinite(latestTimestamp)
    ? new Date(latestTimestamp).toUTCString()
    : null;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(getAbsoluteUrl("/writing"))}</link>
    <description>${escapeXml(description)}</description>
    <language>${SITE_LANGUAGE}</language>
    <atom:link href="${escapeXml(getAbsoluteUrl(WRITING_FEED_PATH))}" rel="self" type="application/rss+xml" />
${lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n` : ""}${items.map(renderItem).join("\n")}
  </channel>
</rss>
`;
};

const createWritingFeed = async (): Promise<string> => {
  const [posts, writingPage] = await Promise.all([
    getWritingPosts(),
    vault.getFile("Writing/page"),
  ]);

  if (!writingPage) {
    throw new Error("Writing index note is missing: Writing/page.md");
  }

  const items = posts.map((note): RssItem => {
    const publishedAt = getNotePublishedAt(note);

    if (!publishedAt) {
      throw new Error(`Writing post is missing its publication date: ${note.vaultPath}.md`);
    }

    return {
      description: getNoteDescription(note),
      publishedAt,
      title: getNoteTitle(note),
      url: getAbsoluteUrl(note.webPath),
    };
  });

  const writingTitle = getNoteTitle(writingPage);
  return renderFeed(
    `${SITE_NAME} — ${writingTitle}`,
    getNoteDescription(writingPage) ?? writingTitle,
    items,
  );
};

export { createWritingFeed };

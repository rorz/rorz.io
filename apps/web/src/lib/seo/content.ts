import type { VaultFrontmatter } from "obsid/vault";
import { getAbsoluteUrl, SITE_TITLE } from "@/lib/seo/site.ts";

interface SeoNote {
  readonly body: string;
  readonly frontmatter: VaultFrontmatter;
  readonly kind: string;
  readonly name: string;
  readonly vaultPath: string;
  readonly webPath: string;
}

const DESCRIPTION_MAX_LENGTH = 160;
const WORD_BOUNDARY_SEARCH_RATIO = 0.6;
const INTERNAL_PATH_PREFIXES = [
  "/templates",
] as const;
const codeFencePattern = /(?:```|~~~)[\s\S]*?(?:```|~~~)/gu;
const htmlTagPattern = /<[^>]*>/gu;
const inlineMarkdownPattern = /[`*_~]/gu;
const markdownLinkPattern = /!?\[([^\]]*)\]\([^)]*\)/gu;
const markdownPrefixPattern = /^\s{0,3}(?:#{1,6}\s+|>\s*|[-+*]\s+|\d+[.)]\s+)/gmu;
const nonProseBlockPattern = /^(?:#{1,6}\s|>|!\[|!\[\[)/u;
const paragraphSeparatorPattern = /\n\s*\n/u;
const separatorBlockPattern = /^(?:-{3,}|_{3,}|\*{3,})$/u;
const whitespacePattern = /\s+/gu;
const wikiLinkPattern = /!?\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/gu;

const getFrontmatterValue = (note: SeoNote, key: string): unknown => note.frontmatter[key];

const getFrontmatterString = (note: SeoNote, key: string): string | null => {
  const value = getFrontmatterValue(note, key);

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
};

const getFrontmatterBoolean = (note: SeoNote, key: string): boolean | null => {
  const value = getFrontmatterValue(note, key);
  return typeof value === "boolean" ? value : null;
};

const parseFrontmatterDate = (note: SeoNote, key: string): Date | null => {
  const value = getFrontmatterValue(note, key);

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const markdownToPlainText = (source: string): string =>
  source
    .replace(codeFencePattern, " ")
    .replace(
      wikiLinkPattern,
      (_match, target: string, label: string | undefined) => label ?? target,
    )
    .replace(markdownLinkPattern, "$1")
    .replace(htmlTagPattern, " ")
    .replace(markdownPrefixPattern, "")
    .replace(inlineMarkdownPattern, "")
    .replace(whitespacePattern, " ")
    .trim();

const isSkippableExcerptBlock = (block: string): boolean => {
  const trimmed = block.trim();

  return !trimmed || nonProseBlockPattern.test(trimmed) || separatorBlockPattern.test(trimmed);
};

const truncateDescription = (value: string, maximum = DESCRIPTION_MAX_LENGTH): string => {
  if (value.length <= maximum) {
    return value;
  }

  const candidate = value.slice(0, maximum - 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const truncated =
    lastSpace > maximum * WORD_BOUNDARY_SEARCH_RATIO ? candidate.slice(0, lastSpace) : candidate;
  return `${truncated.trimEnd()}…`;
};

const getBodyExcerpt = (body: string): string | null => {
  const withoutCodeFences = body.replace(codeFencePattern, " ");

  for (const block of withoutCodeFences.split(paragraphSeparatorPattern)) {
    if (!isSkippableExcerptBlock(block)) {
      const plainText = markdownToPlainText(block);

      if (plainText) {
        return truncateDescription(plainText);
      }
    }
  }

  return null;
};

const getDirectoryTitle = (vaultPath: string): string | null => {
  const segments = vaultPath.split("/");
  const filename = segments.at(-1)?.toLowerCase();

  if (filename !== "page" && !filename?.startsWith("page--")) {
    return null;
  }

  return segments.at(-2) ?? null;
};

const getNoteTitle = (note: SeoNote): string =>
  getFrontmatterString(note, "title") ??
  (note.webPath === "/" ? SITE_TITLE : null) ??
  getDirectoryTitle(note.vaultPath) ??
  note.name;

const getNoteDescription = (note: SeoNote): string | null => {
  const metadata =
    getFrontmatterString(note, "description") ?? getFrontmatterString(note, "byline");

  return metadata ? truncateDescription(metadata) : getBodyExcerpt(note.body);
};

const getNotePublishedAt = (note: SeoNote): Date | null => parseFrontmatterDate(note, "date");

const getNoteModifiedAt = (note: SeoNote): Date | null =>
  parseFrontmatterDate(note, "updated") ?? getNotePublishedAt(note);

const isInternalSitePath = (webPath: string): boolean =>
  INTERNAL_PATH_PREFIXES.some((prefix) => webPath === prefix || webPath.startsWith(`${prefix}/`));

const isInternalVaultPath = (vaultPath: string): boolean =>
  vaultPath.split("/").some((segment) => segment.startsWith("_"));

const isPublishedNote = (note: SeoNote): boolean => {
  if (
    isInternalSitePath(note.webPath) ||
    isInternalVaultPath(note.vaultPath) ||
    getFrontmatterBoolean(note, "draft") === true ||
    getFrontmatterBoolean(note, "published") === false
  ) {
    return false;
  }

  if (note.kind === "film" && !getNotePublishedAt(note)) {
    return false;
  }

  return !(
    note.webPath.startsWith("/writing/") &&
    note.webPath !== "/writing" &&
    note.kind !== "post"
  );
};

const isIndexableNote = (note: SeoNote): boolean =>
  isPublishedNote(note) && getFrontmatterBoolean(note, "noindex") !== true;

const getNoteImage = (note: SeoNote): string | null => {
  const keys = [
    "image",
    ...(note.kind === "image"
      ? [
          "src",
        ]
      : []),
    ...(note.kind === "video"
      ? [
          "thumbnail",
        ]
      : []),
  ];

  for (const key of keys) {
    const value = getFrontmatterString(note, key);

    if (value) {
      try {
        return getAbsoluteUrl(value);
      } catch {
        // Try the next supported image field when an override is not a valid URL.
      }
    }
  }

  return null;
};

const getNoteWordCount = (note: SeoNote): number => {
  const text = markdownToPlainText(note.body);
  return text ? text.split(whitespacePattern).length : 0;
};

export type { SeoNote };
export {
  getFrontmatterString,
  getNoteDescription,
  getNoteImage,
  getNoteModifiedAt,
  getNotePublishedAt,
  getNoteTitle,
  getNoteWordCount,
  isIndexableNote,
  isInternalSitePath,
  isInternalVaultPath,
  isPublishedNote,
};

import type { FC } from "react";
import {
  getFrontmatterString,
  getNoteDescription,
  getNoteImage,
  getNoteModifiedAt,
  getNotePublishedAt,
  getNoteTitle,
  getNoteWordCount,
  type SeoNote,
} from "@/lib/seo/content.ts";
import {
  getAbsoluteUrl,
  SITE_LANGUAGE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/lib/seo/site.ts";

type JsonLdNode = Readonly<Record<string, unknown>>;

interface ContentNodeContext {
  readonly description: string | null;
  readonly image: string | null;
  readonly modifiedAt: string | undefined;
  readonly note: SeoNote;
  readonly publishedAt: string | undefined;
  readonly title: string;
  readonly url: string;
}

const PERSON_ID = getAbsoluteUrl("/#person");
const WEBSITE_ID = getAbsoluteUrl("/#website");

const personNode: JsonLdNode = {
  "@id": PERSON_ID,
  "@type": "Person",
  name: SITE_NAME,
  sameAs: SOCIAL_LINKS,
  url: SITE_URL.toString(),
};

const websiteNode: JsonLdNode = {
  "@id": WEBSITE_ID,
  "@type": "WebSite",
  author: {
    "@id": PERSON_ID,
  },
  inLanguage: SITE_LANGUAGE,
  name: SITE_TITLE,
  url: SITE_URL.toString(),
};

const titleCaseSlug = (slug: string): string => {
  const words = slug.replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};

const getBreadcrumbNode = (note: SeoNote): JsonLdNode | null => {
  if (note.webPath === "/") {
    return null;
  }

  const segments = note.webPath.slice(1).split("/");
  const items = [
    {
      "@type": "ListItem",
      item: SITE_URL.toString(),
      name: "Home",
      position: 1,
    },
    ...segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;

      return {
        "@type": "ListItem",
        item: getAbsoluteUrl(path),
        name: index === segments.length - 1 ? getNoteTitle(note) : titleCaseSlug(segment),
        position: index + 2,
      };
    }),
  ];

  return {
    "@id": `${getAbsoluteUrl(note.webPath)}#breadcrumb`,
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
};

const getPageType = (note: SeoNote): string => {
  if (note.webPath === "/" || note.webPath === "/about") {
    return "ProfilePage";
  }

  if (
    [
      "grid",
      "gridOfGrids",
      "index",
      "list",
      "listOfLists",
    ].includes(note.kind)
  ) {
    return "CollectionPage";
  }

  return "WebPage";
};

const getArticleNode = (context: ContentNodeContext): JsonLdNode => ({
  "@id": `${context.url}#article`,
  "@type": "BlogPosting",
  author: {
    "@id": PERSON_ID,
  },
  dateModified: context.modifiedAt,
  datePublished: context.publishedAt,
  description: context.description ?? undefined,
  headline: context.title,
  ...(context.image
    ? {
        image: context.image,
      }
    : {}),
  inLanguage: SITE_LANGUAGE,
  mainEntityOfPage: {
    "@id": `${context.url}#webpage`,
  },
  url: context.url,
  wordCount: getNoteWordCount(context.note),
});

const getImageNode = (context: ContentNodeContext): JsonLdNode | null =>
  context.image
    ? {
        "@id": `${context.url}#image`,
        "@type": "ImageObject",
        contentUrl: context.image,
        creator: {
          "@id": PERSON_ID,
        },
        dateCreated: context.publishedAt,
        description: context.description ?? undefined,
        name: context.title,
        url: context.url,
      }
    : null;

const getVideoNode = (context: ContentNodeContext): JsonLdNode | null => {
  if (!context.image) {
    return null;
  }

  const source = getFrontmatterString(context.note, "src");

  return {
    "@id": `${context.url}#video`,
    "@type": "VideoObject",
    ...(source
      ? {
          contentUrl: getAbsoluteUrl(source),
        }
      : {}),
    description: context.description ?? undefined,
    name: context.title,
    thumbnailUrl: context.image,
    uploadDate: context.publishedAt,
    url: context.url,
  };
};

const getProjectNode = (context: ContentNodeContext): JsonLdNode => ({
  "@id": `${context.url}#work`,
  "@type": "CreativeWork",
  creator: {
    "@id": PERSON_ID,
  },
  dateCreated: context.publishedAt,
  description: context.description ?? undefined,
  ...(context.image
    ? {
        image: context.image,
      }
    : {}),
  name: context.title,
  url: context.url,
});

const getContentNode = (note: SeoNote): JsonLdNode | null => {
  const context: ContentNodeContext = {
    description: getNoteDescription(note),
    image: getNoteImage(note),
    modifiedAt: getNoteModifiedAt(note)?.toISOString(),
    note,
    publishedAt: getNotePublishedAt(note)?.toISOString(),
    title: getNoteTitle(note),
    url: getAbsoluteUrl(note.webPath),
  };

  switch (note.kind) {
    case "image":
      return getImageNode(context);
    case "post":
      return getArticleNode(context);
    case "project":
      return getProjectNode(context);
    case "video":
      return getVideoNode(context);
    default:
      return null;
  }
};

const getMainEntity = (
  note: SeoNote,
  content: JsonLdNode | null,
): Readonly<Record<"@id", unknown>> | null => {
  if (content) {
    return {
      "@id": content["@id"],
    };
  }

  if (note.webPath === "/" || note.webPath === "/about") {
    return {
      "@id": PERSON_ID,
    };
  }

  return null;
};

const getStructuredData = (note: SeoNote): JsonLdNode => {
  const description = getNoteDescription(note);
  const url = getAbsoluteUrl(note.webPath);
  const breadcrumb = getBreadcrumbNode(note);
  const content = getContentNode(note);
  const mainEntity = getMainEntity(note, content);
  const pageId = `${url}#webpage`;
  const page: JsonLdNode = {
    "@id": pageId,
    "@type": getPageType(note),
    ...(breadcrumb
      ? {
          breadcrumb: {
            "@id": breadcrumb["@id"],
          },
        }
      : {}),
    description: description ?? undefined,
    inLanguage: SITE_LANGUAGE,
    isPartOf: {
      "@id": WEBSITE_ID,
    },
    ...(mainEntity
      ? {
          mainEntity,
        }
      : {}),
    name: getNoteTitle(note),
    url,
  };
  const graph = [
    websiteNode,
    personNode,
    page,
    ...(breadcrumb
      ? [
          breadcrumb,
        ]
      : []),
    ...(content
      ? [
          content,
        ]
      : []),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
};

const serializeStructuredData = (data: JsonLdNode): string =>
  JSON.stringify(data).replaceAll("<", "\\u003c");

interface StructuredDataProps {
  readonly note: SeoNote;
}

const StructuredData: FC<StructuredDataProps> = ({ note }) => (
  <script type="application/ld+json">{serializeStructuredData(getStructuredData(note))}</script>
);

export { StructuredData };

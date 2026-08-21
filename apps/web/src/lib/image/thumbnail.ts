const assetImageOrigin = "https://assets.rorz.io";
const thumbnailPath = "/_images/thumbnail";
const compactThumbnailWidth = 256;
const standardThumbnailWidth = 384;
const wideThumbnailWidth = 640;
const thumbnailWidths = [
  compactThumbnailWidth,
  standardThumbnailWidth,
  wideThumbnailWidth,
] as const;

interface ThumbnailAttributes {
  readonly sizes: string;
  readonly src: string;
  readonly srcSet: string;
}

interface ThumbnailSource {
  readonly path: string;
}

const thumbnailSizes = "(min-width: 1024px) 20rem, 50vw";

const getThumbnailSource = (source: string): ThumbnailSource | null => {
  try {
    const sourceUrl = new URL(source);
    const path = `${sourceUrl.pathname}${sourceUrl.search}`;

    if (sourceUrl.origin === assetImageOrigin) {
      return {
        path,
      };
    }

    return null;
  } catch {
    return null;
  }
};

const getThumbnailUrl = (source: ThumbnailSource, width: number): string => {
  const parameters = new URLSearchParams({
    src: source.path,
    w: String(width),
  });

  return `${thumbnailPath}?${parameters}`;
};

const getCloudflareThumbnailAttributes = (source: string): ThumbnailAttributes | null => {
  const thumbnailSource = getThumbnailSource(source);

  if (!thumbnailSource) {
    return null;
  }

  const largestWidth = thumbnailWidths.at(-1);

  if (largestWidth === undefined) {
    return null;
  }

  return {
    sizes: thumbnailSizes,
    src: getThumbnailUrl(thumbnailSource, largestWidth),
    srcSet: thumbnailWidths
      .map((width) => `${getThumbnailUrl(thumbnailSource, width)} ${width}w`)
      .join(", "),
  };
};

export { assetImageOrigin, getCloudflareThumbnailAttributes, thumbnailPath, thumbnailWidths };

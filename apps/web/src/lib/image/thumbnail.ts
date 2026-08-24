const assetImageOrigin = "https://assets.rorz.io";
const thumbnailPath = "/_images/thumbnail";
const compactThumbnailWidth = 256;
const standardThumbnailWidth = 384;
const wideThumbnailWidth = 640;
const largeThumbnailWidth = 960;
const retinaThumbnailWidth = 1280;
const thumbnailWidths = [
  compactThumbnailWidth,
  standardThumbnailWidth,
  wideThumbnailWidth,
] as const;
const detailThumbnailWidths = [
  wideThumbnailWidth,
  largeThumbnailWidth,
  retinaThumbnailWidth,
] as const;
const allowedThumbnailWidths = [
  compactThumbnailWidth,
  standardThumbnailWidth,
  wideThumbnailWidth,
  largeThumbnailWidth,
  retinaThumbnailWidth,
] as const;

type ThumbnailVariant = "card" | "detail";

interface ThumbnailAttributes {
  readonly sizes: string;
  readonly src: string;
  readonly srcSet: string;
}

interface ThumbnailSource {
  readonly path: string;
}

const thumbnailSizes = {
  card: "(min-width: 1024px) 20rem, 50vw",
  detail: "(min-width: 1024px) 41rem, calc(100vw - 1.5rem)",
} satisfies Record<ThumbnailVariant, string>;

const thumbnailWidthsByVariant = {
  card: thumbnailWidths,
  detail: detailThumbnailWidths,
} satisfies Record<ThumbnailVariant, readonly number[]>;

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

const getCloudflareThumbnailAttributes = (
  source: string,
  variant: ThumbnailVariant = "card",
): ThumbnailAttributes | null => {
  const thumbnailSource = getThumbnailSource(source);

  if (!thumbnailSource) {
    return null;
  }

  const widths = thumbnailWidthsByVariant[variant];
  const largestWidth = widths.at(-1);

  if (largestWidth === undefined) {
    return null;
  }

  return {
    sizes: thumbnailSizes[variant],
    src: getThumbnailUrl(thumbnailSource, largestWidth),
    srcSet: widths
      .map((width) => `${getThumbnailUrl(thumbnailSource, width)} ${width}w`)
      .join(", "),
  };
};

export type { ThumbnailVariant };
export {
  allowedThumbnailWidths,
  assetImageOrigin,
  getCloudflareThumbnailAttributes,
  thumbnailPath,
  thumbnailSizes,
};

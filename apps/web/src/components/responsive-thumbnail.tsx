// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Image from "next/image";
import {
  getCloudflareThumbnailAttributes,
  type ThumbnailVariant,
  thumbnailSizes,
} from "@/lib/image/thumbnail.ts";

interface ResponsiveThumbnailProps {
  readonly alt: string;
  readonly loading?: "eager" | "lazy";
  readonly source: string;
  readonly variant?: ThumbnailVariant;
}

const ResponsiveThumbnail = ({
  alt,
  loading = "lazy",
  source,
  variant = "card",
}: ResponsiveThumbnailProps) => {
  const cloudflareAttributes = getCloudflareThumbnailAttributes(source, variant);

  if (cloudflareAttributes) {
    return (
      // biome-ignore lint/performance/noImgElement: This responsive image uses the Worker transform endpoint that next/image cannot use for remote sources.
      <img
        {...cloudflareAttributes}
        alt={alt}
        className="size-full object-cover"
        decoding="async"
        height={1}
        loading={loading}
        width={1}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className="object-cover"
      fill={true}
      loading={loading}
      sizes={thumbnailSizes[variant]}
      src={source}
    />
  );
};

export { ResponsiveThumbnail };

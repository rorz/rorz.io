import { PlayIcon } from "@phosphor-icons/react/ssr";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Image from "next/image";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import { Children, type ReactNode } from "react";
import { cn } from "@/lib/cn/index.ts";
import { getCloudflareThumbnailAttributes } from "@/lib/image/thumbnail.ts";

interface CollectionGridProps {
  readonly children: ReactNode;
  readonly layout?: "grid" | "row";
}

interface CollectionGridItemProps {
  readonly description?: ReactNode;
  readonly href: string;
  readonly imageAlt: string;
  readonly imageSrc: string;
  readonly thumbnailKind?: "image" | "video";
  readonly title: string;
  readonly variant?: "card" | "icon";
}

const collectionRowLimit = 4;

const CollectionGrid = ({ children, layout = "grid" }: CollectionGridProps) => {
  const items = Children.toArray(children);
  const displayedItems = layout === "row" ? items.slice(0, collectionRowLimit) : items;

  return (
    <ul
      className={cn(
        "grid gap-4 w-full",
        layout === "grid"
          ? "grid-cols-2"
          : "grid-cols-3 lg:grid-cols-4 [&>li:nth-child(4)]:hidden lg:[&>li:nth-child(4)]:block",
      )}
    >
      {displayedItems}
    </ul>
  );
};

const CollectionThumbnail = ({
  alt,
  source,
}: {
  readonly alt: string;
  readonly source: string;
}) => {
  const cloudflareAttributes = getCloudflareThumbnailAttributes(source);

  if (cloudflareAttributes) {
    return (
      // biome-ignore lint/performance/noImgElement: This responsive image uses the Worker transform endpoint that next/image cannot use for remote sources.
      <img
        {...cloudflareAttributes}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        decoding="async"
        height={1}
        loading="lazy"
        width={1}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className="object-cover"
      fill={true}
      sizes="(min-width: 1024px) 20rem, 50vw"
      src={source}
    />
  );
};

const CollectionGridItem = ({
  description,
  href,
  imageAlt,
  imageSrc,
  thumbnailKind = "image",
  title,
  variant = "card",
}: CollectionGridItemProps) => (
  <li className="col-span-1">
    <Link
      aria-label={variant === "icon" ? title : undefined}
      className="block border border-transparent group hover:border-black focus-visible:border-black focus-visible:outline-none dark:hover:border-white dark:focus-visible:border-white"
      href={href}
    >
      <article className="border">
        <div
          className={cn(
            "w-full relative overflow-hidden bg-neutral-300 dark:bg-zinc-700",
            variant === "icon" ? "aspect-square" : "h-32",
          )}
        >
          <CollectionThumbnail alt={imageAlt} source={imageSrc} />
          {thumbnailKind === "video" ? (
            <span
              aria-hidden={true}
              className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 size-9 flex items-center justify-center bg-black text-white"
            >
              <PlayIcon className="size-5" weight="fill" />
            </span>
          ) : null}
          {variant === "card" ? (
            <h3 className="absolute bottom-0 left-0 px-2 py-1 bg-black text-white font-semibold font-stretch-semi-condensed">
              {title}
            </h3>
          ) : null}
        </div>
        {variant === "card" && description !== undefined ? (
          <div className="flex flex-col items-start gap-1 p-2">
            <span className="font-serif">{description}</span>
          </div>
        ) : null}
      </article>
    </Link>
  </li>
);

export { CollectionGrid, CollectionGridItem };

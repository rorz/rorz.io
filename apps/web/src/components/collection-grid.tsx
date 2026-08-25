import { PlayIcon } from "@phosphor-icons/react/ssr";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import { Children, type ReactNode } from "react";
import { ResponsiveThumbnail } from "@/components/responsive-thumbnail.tsx";
import { cn } from "@/lib/cn/index.ts";

interface CollectionGridProps {
  readonly children: ReactNode;
  readonly layout?: "grid" | "row";
}

interface CollectionGridItemBaseProps {
  readonly href: string;
  readonly imageAlt: string;
  readonly imageSrc: string;
  readonly title: string;
}

interface CollectionGridCardProps extends CollectionGridItemBaseProps {
  readonly description?: ReactNode;
  readonly kind: "card";
}

interface CollectionGridImageProps extends CollectionGridItemBaseProps {
  readonly kind: "image";
}

interface CollectionGridVideoProps extends CollectionGridItemBaseProps {
  readonly kind: "video";
}

type CollectionGridItemProps =
  | CollectionGridCardProps
  | CollectionGridImageProps
  | CollectionGridVideoProps;

const collectionRowLimit = 4;

const CollectionGrid = ({ children, layout = "grid" }: CollectionGridProps) => {
  const items = Children.toArray(children);
  const displayedItems = layout === "row" ? items.slice(0, collectionRowLimit) : items;

  return (
    <ul
      className={cn(
        "grid gap-4 w-full",
        layout === "grid"
          ? "grid-cols-3"
          : "grid-cols-3 lg:grid-cols-4 [&>li:nth-child(4)]:hidden lg:[&>li:nth-child(4)]:block",
      )}
    >
      {displayedItems}
    </ul>
  );
};

const CollectionGridCard = ({
  description,
  imageAlt,
  imageSrc,
  title,
}: CollectionGridCardProps) => (
  <>
    <div className="w-full relative overflow-hidden flex flex-col items-center">
      <div className="w-full aspect-3/2">
        <ResponsiveThumbnail alt={imageAlt} source={imageSrc} />
      </div>
      <div className="flex flex-col items-start size-full justify-end">
        <h3 className="px-2 py-1 bg-black text-white font-semibold font-stretch-semi-condensed w-full">
          {title}
        </h3>
        {description === undefined ? null : (
          <span className="font-serif px-2 py-1">{description}</span>
        )}
      </div>
    </div>
  </>
);

const CollectionGridImage = ({ imageAlt, imageSrc }: CollectionGridImageProps) => (
  <div className="w-full relative aspect-square overflow-hidden bg-neutral-300 dark:bg-zinc-700">
    <ResponsiveThumbnail alt={imageAlt} source={imageSrc} />
  </div>
);

const CollectionGridVideo = ({ imageAlt, imageSrc }: CollectionGridVideoProps) => (
  <div className="w-full relative aspect-square overflow-hidden bg-neutral-300 dark:bg-zinc-700">
    <ResponsiveThumbnail alt={imageAlt} source={imageSrc} />
    <span
      aria-hidden={true}
      className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 size-9 flex items-center justify-center bg-black text-white"
    >
      <PlayIcon className="size-5" weight="fill" />
    </span>
  </div>
);

const renderCollectionGridItem = (props: CollectionGridItemProps) => {
  switch (props.kind) {
    case "card":
      return <CollectionGridCard {...props} />;
    case "image":
      return <CollectionGridImage {...props} />;
    case "video":
      return <CollectionGridVideo {...props} />;
    default:
      return props satisfies never;
  }
};

const CollectionGridItem = (props: CollectionGridItemProps) => (
  <li className="col-span-1">
    <Link
      aria-label={props.kind === "card" ? undefined : props.title}
      className="block border border-transparent group hover:border-black focus-visible:border-black focus-visible:outline-none dark:hover:border-white dark:focus-visible:border-white grayscale-0 hover:grayscale-0"
      href={props.href}
    >
      <article className="border">{renderCollectionGridItem(props)}</article>
    </Link>
  </li>
);

export { CollectionGrid, CollectionGridItem };

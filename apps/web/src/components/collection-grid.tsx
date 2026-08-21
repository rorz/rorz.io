// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Image from "next/image";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn/index.ts";

interface CollectionGridProps {
  readonly children: ReactNode;
  readonly layout?: "grid" | "row";
}

interface CollectionGridItemProps {
  readonly description?: ReactNode;
  readonly href: string;
  readonly imageAlt: string;
  readonly imageSrc: string;
  readonly title: string;
  readonly variant?: "card" | "icon";
}

const CollectionGrid = ({ children, layout = "grid" }: CollectionGridProps) => (
  <ul
    className={cn(
      "grid gap-4 w-full",
      layout === "grid"
        ? "grid-cols-2"
        : "grid-flow-col auto-cols-[calc((100%_-_2rem)/3)] lg:auto-cols-[calc((100%_-_3rem)/4)] overflow-x-auto pb-1",
    )}
  >
    {children}
  </ul>
);

const CollectionGridItem = ({
  description,
  href,
  imageAlt,
  imageSrc,
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
          <Image
            alt={imageAlt}
            className="object-cover"
            fill={true}
            sizes="(min-width: 1024px) 20rem, 50vw"
            src={imageSrc}
          />
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

// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Image from "next/image";
import type { ComponentProps } from "react";

type MarkdownImageProps = ComponentProps<"img"> & {
  readonly node?: unknown;
};

const toDimension = (value: number | string | undefined): number | undefined => {
  const dimension = typeof value === "string" ? Number(value) : value;

  return dimension !== undefined && Number.isFinite(dimension) && dimension > 0
    ? dimension
    : undefined;
};

const MarkdownImage = ({
  alt = "",
  height: heightProperty,
  node: _node,
  src,
  width: widthProperty,
  ...properties
}: MarkdownImageProps) => {
  if (typeof src !== "string" || !src) {
    return null;
  }

  const height = toDimension(heightProperty);
  const width = toDimension(widthProperty);
  const sizes = width === undefined ? "100vw" : `(max-width: ${width}px) 100vw, ${width}px`;

  return (
    <Image
      {...properties}
      alt={alt}
      {...(height === undefined
        ? {}
        : {
            height,
          })}
      sizes={sizes}
      src={src}
      {...(width === undefined
        ? {}
        : {
            width,
          })}
    />
  );
};

export { MarkdownImage };

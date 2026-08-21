import type { ComponentProps } from "react";
import { cn } from "@/lib/cn/index.ts";

type MarkdownBlockquoteProps = ComponentProps<"blockquote"> & {
  readonly node?: unknown;
};

const MarkdownBlockquote = ({ className, node: _node, ...properties }: MarkdownBlockquoteProps) => (
  <blockquote
    {...properties}
    className={cn(
      "my-4 border-zinc-300 border-l-2 pl-4 italic text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
      className,
    )}
  />
);

export { MarkdownBlockquote };

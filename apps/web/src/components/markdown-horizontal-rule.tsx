import type { ComponentProps } from "react";
import { cn } from "@/lib/cn/index.ts";

type MarkdownHorizontalRuleProps = ComponentProps<"hr"> & {
  readonly node?: unknown;
};

const MarkdownHorizontalRule = ({
  // className,
  node: _node,
  // ...properties
}: MarkdownHorizontalRuleProps) => (
  // <hr
  //   {...properties}
  //   className={cn("my-6 w-full border-0 border-zinc-300 border-t dark:border-zinc-700", className)}
  // />
  <div className="w-full flex items-center gap-2 mb-1">
    <hr className="w-6 border-zinc-300" />
    <span className="mt-1 text-zinc-400">
      *<sup>*</sup>*<sub>*</sub>*
    </span>
    <hr className="w-6 border-zinc-300" />
  </div>
);

export { MarkdownHorizontalRule };

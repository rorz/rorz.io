import { clsx } from "clsx";
import type { ReactNode } from "react";

const Tag = ({
  children,
  inBar = false,
}: {
  readonly children: ReactNode;
  readonly inBar?: boolean;
}) => (
  <span
    className={clsx(
      "rounded-sm border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-xs/4 text-zinc-400 uppercase",
      inBar ? "static flex-none" : "absolute top-2.5 left-3 z-10",
    )}
  >
    {children}
  </span>
);

export { Tag };

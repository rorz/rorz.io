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
      "rounded-[5px] border border-[#30343a] bg-[#17191d] px-1.5 py-0.5 text-[11px]/[1.3] text-[#aeb6c2] uppercase",
      inBar ? "static flex-none" : "absolute top-2.5 left-3 z-10",
    )}
  >
    {children}
  </span>
);

export { Tag };

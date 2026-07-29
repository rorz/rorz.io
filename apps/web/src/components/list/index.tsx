import Link from "next/link";
import type { FC, ReactNode } from "react";
import { cn } from "@/lib/cn/index.ts";

type ListItemProps = {
  title: string;
  href: string;
  decoration: string | ReactNode;
};

type ListProps = {
  children: ReactNode;
  className?: string;
};

export const ListItem: FC<ListItemProps> = ({ title, href, decoration }) => (
  <li className="w-full">
    <Link className="flex justify-between items-center w-full group pb-4" href={href}>
      <span className="group-hover:underline underline-offset-2 decoration-1">{title}</span>
      <div className="w-full flex-1 border-b -mt-2 border-neutral-100 group-hover:border-neutral-800">
        <span className="no-underline hover:no-underline">&nbsp;</span>
      </div>
      <span className="group-hover:bg-black group-hover:text-white bg-neutral-200 border-neutral-200 px-2 pt-0.5 flex justify-end -mt-1.5 border-b group-hover:border-black">
        <span className="text-sm">{decoration}</span>
      </span>
    </Link>
  </li>
);

export const List: FC<ListProps> = ({ children, className }) => (
  <ul className={cn("flex flex-col items-start gap-0 w-full", className)}>{children}</ul>
);

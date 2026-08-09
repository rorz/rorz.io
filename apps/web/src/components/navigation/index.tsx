"use client";

// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn/index.ts";
import { isActiveNavigationPath } from "./path.ts";

interface NavigationItem {
  readonly href: string;
  readonly label: string;
}

interface NavigationProps {
  readonly items: readonly NavigationItem[];
}

const getAriaCurrent = (isActive: boolean): "location" | undefined => {
  if (isActive) {
    return "location";
  }
};

const Navigation = ({ items }: NavigationProps) => {
  const pathname = usePathname();

  return (
    <nav className="pt-2 lg:pt-0 lg:w-full flex flex-wrap lg:flex-nowrap lg:flex-col items-start underline-offset-2">
      {items.map((item) => {
        const isActive = isActiveNavigationPath(pathname, item.href);
        return (
          <Link
            aria-current={getAriaCurrent(isActive)}
            className={cn(
              "bg-transparent lg:w-full mb-2 lg:mb-0 px-2 py-0.5 pt-1.5 hover:bg-neutral-200 dark:hover:bg-zinc-800 font-semibold",
              isActive &&
                "bg-black dark:bg-zinc-600 text-white hover:bg-black dark:hover:bg-zinc-600",
            )}
            href={item.href}
            key={`${item.href}:${item.label}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export { Navigation };

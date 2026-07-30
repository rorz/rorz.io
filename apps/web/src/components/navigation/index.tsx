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
    <nav className="col-span-2 flex flex-col items-start pt-2 underline-offset-2">
      {/*<a
        aria-current={getAriaCurrent(isHomeActive)}
        className={cn("mb-2 text-base font-bold hover:underline")}
        href="/"
      >
        Rory McMeekin
      </a>*/}
      {items.map((item) => {
        const isActive = isActiveNavigationPath(pathname, item.href);

        return (
          <Link
            aria-current={getAriaCurrent(isActive)}
            className={cn(
              "bg-transparent w-full px-2 py-0.5 pt-1.5 hover:bg-neutral-200 font-semibold",
              isActive && "bg-black text-white hover:bg-black",
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

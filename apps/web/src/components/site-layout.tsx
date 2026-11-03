// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
import type { FC, ReactNode } from "react";
import { Navigation } from "@/components/navigation/index.tsx";
import { ThemeToggles } from "@/components/theme-toggles.tsx";
import { cn } from "@/lib/cn/index.ts";
import { parseFrontmatter, rootFrontmatterSchema } from "@/lib/vault/frontmatter.ts";
import { getVaultRouteManifest, vault } from "@/lib/vault/index.ts";

const Masthead: FC<{
  className?: string;
}> = ({ className }) => (
  <Link
    className={cn(
      "group col-span-2 bg-black dark:bg-zinc-600 text-white flex items-end pb-1",
      className,
    )}
    href="/"
  >
    <span className="block px-2 font-bold group-hover:underline underline-offset-2 font-sans text-lg font-stretch-semi-condensed">
      Rory&nbsp;McMeekin
    </span>
  </Link>
);

const getDirectoryHref = (
  getWebPath: (vaultPath: string) => string | null,
  resolvedPath: string | null,
  target: string,
): string => {
  if (resolvedPath) {
    const webPath = getWebPath(resolvedPath);

    if (webPath) {
      return webPath;
    }
  }

  return `#unresolved-${encodeURIComponent(target)}`;
};

const SiteLayout = async ({ children }: { readonly children: ReactNode }) => {
  const [manifest, rootPage] = await Promise.all([
    getVaultRouteManifest(),
    vault.getFile("page"),
  ]);

  if (!rootPage) {
    throw new Error("Missing vault root page: page");
  }

  const { directories } = parseFrontmatter(rootPage, rootFrontmatterSchema);
  const navigationItems = directories.map((directory) => ({
    href: getDirectoryHref(manifest.getWebPath, directory.resolvedPath, directory.target),
    label: directory.label,
  }));

  return (
    <>
      <div className="size-full lg:max-w-5xl lg:grid lg:grid-cols-12 flex flex-col items-start">
        <div className="lg:col-span-2 flex lg:flex-col gap-2 lg:gap-6 w-full items-start">
          <div className="flex flex-col lg:min-w-unset lg:w-full">
            <Masthead className="h-14 lg:h-28 lg:w-full mb-1 lg:mb-0" />
            <div className="lg:hidden">
              <ThemeToggles />
            </div>
          </div>
          <Navigation items={navigationItems} />
        </div>
        <main className="w-full lg:col-span-8 lg:pl-8 lg:pt-34 pt-12 px-3">{children}</main>
        <div className="hidden col-span-2 lg:flex items-start justify-end pr-2">
          <ThemeToggles />
        </div>
      </div>
      <footer className="mt-auto pt-12 pb-8">
        <span className="font-sans text-xs text-zinc-500">
          Content &copy; {new Date().getFullYear()} Rory McMeekin. Code is{" "}
          <a
            className="underline"
            href="https://github.com/rorz/rorz.io"
            rel="noopener"
            target="_blank"
          >
            open source.
          </a>
        </span>
      </footer>
    </>
  );
};

export { SiteLayout };

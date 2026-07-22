import type { ReactNode } from "react";
import "@/styles.css";
import { CircleHalfTiltIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/ssr";
import { Navigation } from "@/components/navigation/index.tsx";
import { parseFrontmatter, rootFrontmatterSchema } from "@/lib/vault/frontmatter.ts";
import { getVaultRouteManifest, vault } from "@/lib/vault/index.ts";

interface RootLayoutProps {
  readonly children: ReactNode;
}

const getDirectoryHref = (
  getHref: (sourcePath: string) => string | null,
  resolvedPath: string | null,
  target: string,
): string => {
  if (resolvedPath) {
    const href = getHref(resolvedPath);

    if (href) {
      return href;
    }
  }

  return `#unresolved-${encodeURIComponent(target)}`;
};

const RootLayout = async ({ children }: RootLayoutProps) => {
  const [manifest, rootPage] = await Promise.all([
    getVaultRouteManifest(),
    vault.getFile("page"),
  ]);

  if (!rootPage) {
    throw new Error("Missing vault root page: page");
  }

  const { directories } = parseFrontmatter(rootPage, rootFrontmatterSchema);
  const navigationItems = directories.map((directory) => ({
    href: getDirectoryHref(manifest.getHref, directory.resolvedPath, directory.target),
    label: directory.label,
  }));

  return (
    <html lang="en">
      <body className="size-full flex flex-col items-center justify-start">
        <div className="size-full max-w-5xl grid grid-cols-12 mb-4">
          <a className="group col-span-2 border-neutral-100 bg-black text-white pt-18" href="/">
            <span className="block px-2 bg-neutral-100/0 font-bold group-hover:underline underline-offset-2">
              Rory McMeekin
            </span>
          </a>
          <div className="col-span-8" />
          <div className="col-span-2 flex items-start justify-end gap-1.5 pt-2 pr-2">
            <button className="text-black" type="button">
              <SunIcon className="size-5" weight="regular" />
            </button>
            <div className="text-black">
              <MoonIcon className="size-5" weight="regular" />
            </div>
            <div className="text-black">
              <CircleHalfTiltIcon className="size-5" weight="regular" />
            </div>
          </div>
        </div>
        <div className="size-full max-w-5xl grid grid-cols-12">
          <Navigation items={navigationItems} />
          <main className="col-span-8 pl-8 pt-2">{children}</main>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;

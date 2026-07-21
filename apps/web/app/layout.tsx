import type { ReactNode } from "react";
import "./styles.css";
import { isVaultLink, type VaultLink } from "obsid/vault";
import { Navigation } from "./navigation.tsx";
import { getVaultRouteManifest, vault } from "./vault.ts";

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

const getLinkList = (value: unknown): readonly VaultLink[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isVaultLink);
};

const RootLayout = async ({ children }: RootLayoutProps) => {
  const [manifest, rootPage] = await Promise.all([
    getVaultRouteManifest(),
    vault.getFile("page"),
  ]);

  if (!rootPage) {
    throw new Error("Missing vault root page: page");
  }

  const directories = getLinkList(rootPage.frontmatter.directories);
  const navigationItems = directories.map((directory) => ({
    href: getDirectoryHref(manifest.getHref, directory.resolvedPath, directory.target),
    label: directory.label,
  }));

  return (
    <html lang="en">
      <body className="size-full flex flex-col items-center justify-start">
        <div className="size-full max-w-5xl grid grid-cols-12 pt-8 mb-4">
          <div className="col-span-2 border-b-4 border-neutral-100">
            <a
              className="block px-2 bg-neutral-100 pb-0 pt-1 font-bold hover:underline underline-offset-2"
              href="/"
            >
              Rory McMeekin
            </a>
          </div>
          <div className="col-span-8 border-b-4 border-neutral-100" />
          <div className="col-span-2 flex items-start justify-end gap-1">
            <div className="size-4 rounded-xs bg-black border" />
            <div className="size-4 rounded-xs bg-neutral-400 border" />
            <div className="size-4 rounded-xs bg-white border" />
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

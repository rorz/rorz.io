import type { ReactNode } from "react";
import "./styles.css";
import { isVaultLink, type VaultLink } from "obsid/vault";
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

  return (
    <html lang="en">
      <body className="size-full flex items-start justify-center">
        <div className="size-full max-w-5xl grid grid-cols-12 pt-12 gap-3">
          <nav className="col-span-2 flex flex-col items-start gap-0.5">
            <h1 className="text-base font-bold mb-2">Rory McMeekin</h1>
            {directories.map((directory) => (
              <a
                className="underline"
                href={getDirectoryHref(manifest.getHref, directory.resolvedPath, directory.target)}
                key={directory.target}
              >
                {directory.label}
              </a>
            ))}
          </nav>
          <main className="col-span-8 bg-blue-100">{children}</main>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;

import type { FC, ReactNode } from "react";
import "@/styles.css";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import { Libertinus_Serif, Zalando_Sans } from "next/font/google";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Link from "next/link";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Script from "next/script";
import { Navigation } from "@/components/navigation/index.tsx";
import { ThemeToggles } from "@/components/theme-toggles.tsx";
import { cn } from "@/lib/cn/index.ts";
import { parseFrontmatter, rootFrontmatterSchema } from "@/lib/vault/frontmatter.ts";
import { getVaultRouteManifest, vault } from "@/lib/vault/index.ts";

const libertinusSerif = Libertinus_Serif({
  subsets: [
    "latin",
  ],
  variable: "--font-libertinus-serif",
  weight: [
    "400",
    "600",
    "700",
  ],
});

const zalandoSans = Zalando_Sans({
  axes: [
    "wdth",
  ],
  subsets: [
    "latin",
  ],
  variable: "--font-zalando-sans",
});

const metadata = {
  icons: {
    icon: {
      type: "image/svg+xml",
      url: "/mark.svg",
    },
  },
};

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

interface RootLayoutProps {
  readonly children: ReactNode;
}

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
    href: getDirectoryHref(manifest.getWebPath, directory.resolvedPath, directory.target),
    label: directory.label,
  }));

  return (
    <html className={`${zalandoSans.variable} ${libertinusSerif.variable}`} lang="en">
      {/* biome-ignore lint/correctness/useUniqueElementIds: The root layout renders once and Next Script needs a stable id. */}
      <Script id="detect-theme" strategy="beforeInteractive">
        {`document.documentElement.classList.toggle(
          "dark",
          localStorage.theme === "dark" ||
            (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
        );`}
      </Script>
      <body className="size-full flex flex-col items-center justify-start bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <div className="size-full lg:max-w-5xl lg:grid lg:grid-cols-12 flex flex-col items-start">
          <div className="lg:col-span-2 flex lg:flex-col gap-2 lg:gap-6 w-full items-start">
            <div className="flex flex-col lg:min-w-unset lg:w-full">
              <Masthead className="h-14 lg:h-28 lg:w-full" />
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
      </body>
    </html>
  );
};

// biome-ignore lint/style/useComponentExportOnlyModules: App Router layouts export metadata beside the component.
export { metadata };
export default RootLayout;

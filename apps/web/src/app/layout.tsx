// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles.css";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import { JetBrains_Mono, Libertinus_Serif, Zalando_Sans } from "next/font/google";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import Script from "next/script";
import { PostHog } from "@/components/posthog.tsx";
import { postHogConfig } from "@/lib/posthog/config.ts";
import {
  RSS_ALTERNATES,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo/site.ts";

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

const jetBrainsMono = JetBrains_Mono({
  subsets: [
    "latin",
  ],
  variable: "--font-jetbrains-mono",
});

const metadata: Metadata = {
  alternates: {
    types: RSS_ALTERNATES,
  },
  applicationName: SITE_NAME,
  authors: [
    {
      name: SITE_NAME,
      url: SITE_URL.toString(),
    },
  ],
  creator: SITE_NAME,
  icons: {
    icon: {
      type: "image/svg+xml",
      url: "/mark.svg",
    },
  },
  metadataBase: SITE_URL,
  openGraph: {
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    type: "website",
    url: "/",
  },
  publisher: SITE_NAME,
  referrer: "origin-when-cross-origin",
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: SITE_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  twitter: {
    card: "summary",
    creator: "@rorzio",
    title: SITE_TITLE,
  },
};

const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    {
      color: "#ffffff",
      media: "(prefers-color-scheme: light)",
    },
    {
      color: "#18181b",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html
      className={`${zalandoSans.variable} ${libertinusSerif.variable} ${jetBrainsMono.variable}`}
      lang={SITE_LANGUAGE}
    >
      {/* biome-ignore lint/correctness/useUniqueElementIds: The root layout renders once and Next Script needs a stable id. */}
      <Script id="detect-theme" strategy="beforeInteractive">
        {`document.documentElement.classList.toggle(
          "dark",
          localStorage.theme === "dark" ||
            (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
        );`}
      </Script>
      <body className="size-full flex flex-col items-center justify-start bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 min-h-screen">
        <PostHog apiHost={postHogConfig.apiHost} projectToken={postHogConfig.projectToken} />
        {children}
      </body>
    </html>
  );
};

// biome-ignore lint/style/useComponentExportOnlyModules: App Router layouts export metadata beside the component.
export { metadata, viewport };
export default RootLayout;

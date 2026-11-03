// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import type { Metadata } from "next";
// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import { Crimson_Text } from "next/font/google";
import type { ReactNode } from "react";
import { SITE_LOCALE, SITE_NAME } from "@/lib/seo/site.ts";
import { TopBars } from "./top-bars.tsx";

const crimsonText = Crimson_Text({
  subsets: [
    "latin",
  ],
  variable: "--font-crimson-text",
  weight: [
    "400",
    "600",
    "700",
  ],
});

const title = "Résumé";
const description =
  "Full-stack engineer and designer based in London. Experience and education of Rory McMeekin.";

const metadata: Metadata = {
  alternates: {
    canonical: "/resume",
  },
  description,
  openGraph: {
    description,
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title: `${title} — ${SITE_NAME}`,
    type: "website",
    url: "/resume",
  },
  title,
  twitter: {
    card: "summary",
    creator: "@rorzio",
    description,
    title: `${title} — ${SITE_NAME}`,
  },
};

const experience = [
  {
    description:
      "A hard-pivot from Verdn (same company, different idea). Created realtime website personalisation tools using AI including: brand and design inference; image brand replacement; visitor detection with dynamic copy changes; and generative pages.",
    role: "Technical Co-Founder",
    title: "Kenobi",
    // biome-ignore lint/security/noSecrets: This is an employment date range.
    year: "2025–2026",
  },
  {
    description:
      "The first API to facilitate verified, trackable impact for donations to social and environmental causes. Started out by winning Shopify's App Challenge, went through multiple accelerator programs (incl. Y Combinator), and planted millions of trees and recovered over half a million kilos of ocean-bound plastic.",
    role: "Technical Co-Founder",
    title: "Verdn",
    year: "2020–2025",
  },
  {
    description:
      'Boutique agency in Norway where I built marketing projects including: interactive journalism for TV2 (broadcaster); a realtime "video wall" (130k participants) for Alan Walker\'s album release; and a WebRTC webinar streaming platform.',
    role: "Technical & Design Lead",
    title: "SAIL",
    year: "2019–2020",
  },
  {
    description:
      "Personally made the web app for a two-sided sports facility booking marketplace. Built the first major release used to raise their seed round. Code still in production.",
    role: "Founding Engineer",
    title: "Pitchbooking",
    year: "2017–2019",
  },
  {
    description:
      "R&D for the production and sale of carbon-negative fuel. Created whitepapers, marketing videos, 2/3D graphics, app prototypes, and PDF automation pipelines.",
    role: "Product Engineer",
    title: "SkyMining",
    year: "2013–2016",
  },
] as const;

const education = [
  {
    description:
      "Joined with Verdn shortly after raising our angel round. Tripled revenue during the program and raised a pre-seed round during Demo Day.",
    role: "Verdn / Kenobi",
    title: "Y Combinator",
    year: "Winter 2022",
  },
  {
    description:
      "Graduated with First Class Honours and an Associateship (AKC). Received Apple's WWDC scholarship twice. Made many iOS apps, including one for the business society, and Lanterna Education.",
    role: "BSc. Business Management",
    title: "King's College London",
    year: "grad. 2014",
  },
] as const;

const Section = ({ children, title: sectionTitle }: { children: ReactNode; title: string }) => (
  <section className="flex flex-col gap-2">
    <h2 className="mb-1 text-resume-heading font-black uppercase tracking-widest text-red-700">
      {sectionTitle}
    </h2>
    {children}
  </section>
);

const Entry = ({
  title: entryTitle,
  year,
  role,
  description: entryDescription,
}: {
  title: string;
  year: string;
  role: string;
  description: string;
}) => (
  <div className="flex break-inside-avoid flex-col">
    <h3 className="text-base font-semibold">
      <span className="font-bold">{entryTitle}</span> ({year}) ~ <i>{role}</i>
    </h3>
    <p className="text-resume">{entryDescription}</p>
  </div>
);

const ResumePage = () => (
  <main
    className={`${crimsonText.variable} flex min-h-dvh w-full justify-center bg-taupe-200 p-4 font-resume text-taupe-950 antialiased scheme-light sm:p-8 lg:p-16 print:block print:min-h-0 print:bg-white print:p-0`}
    // biome-ignore lint/style/noInlineStyles: Assign the named A4 page without changing other routes' print layout.
    style={{
      page: "resume",
      // biome-ignore lint/style/noReactNativeLiteralColors: This CSS print option is not a color.
      printColorAdjust: "exact",
    }}
  >
    <article className="relative min-h-a4-height w-full max-w-a4-width overflow-hidden bg-taupe-50 px-6 py-22 text-center leading-snug shadow-2xl ring-1 ring-black/10 selection:bg-taupe-800 selection:text-white sm:px-20 lg:px-40 print:w-a4-width print:max-w-none print:bg-white print:px-40 print:shadow-none print:ring-0">
      <TopBars />
      <div className="relative z-10 flex flex-col gap-7 mt-4">
        <header className="flex flex-col gap-3">
          <h1 className="mb-2 text-4xl font-semibold text-red-800">Rory McMeekin</h1>
          <p className="text-resume">
            Full-stack AI engineer and designer based in London. I care about the intersection of
            computing and creativity, and leveraging that to make great societal impact.
          </p>
          <p className="text-resume">
            I am currently on a break until January to work on new ideas and to travel, post my
            startup Kenobi (YC-backed). For fun I make music, images, and other web projects which
            you can find on{" "}
            <a
              className="font-semibold text-red-800 underline"
              href="https://rorz.io"
              rel="noopener noreferrer"
              target="_blank"
            >
              my website (rorz.io).
            </a>
          </p>
        </header>

        <Section title="Experience">
          {experience.map((entry) => (
            <Entry key={entry.title} {...entry} />
          ))}
        </Section>

        <Section title="Education">
          {education.map((entry) => (
            <Entry key={entry.title} {...entry} />
          ))}
        </Section>
      </div>
    </article>
  </main>
);

// biome-ignore lint/style/useComponentExportOnlyModules: App Router pages export metadata beside the component.
export { metadata };
export default ResumePage;

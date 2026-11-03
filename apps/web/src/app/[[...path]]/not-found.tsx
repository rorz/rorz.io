// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import type { Metadata } from "next";
import { Page } from "@/components/page.tsx";

const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Page not found",
};

const NotFound = () => (
  <Page title="Page not found">
    <p className="font-serif text-lg">That page does not exist.</p>
  </Page>
);

// biome-ignore lint/style/useComponentExportOnlyModules: App Router not-found files export metadata beside the component.
export { metadata };
export default NotFound;

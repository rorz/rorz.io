// biome-ignore lint/correctness/noUndeclaredDependencies: Vinext provides this Next.js-compatible module.
import type { MetadataRoute } from "next";
import { getAbsoluteUrl, SITE_URL } from "@/lib/seo/site.ts";

const robots = (): MetadataRoute.Robots => ({
  host: SITE_URL.origin,
  rules: {
    allow: "/",
    userAgent: "*",
  },
  sitemap: getAbsoluteUrl("/sitemap.xml"),
});

export default robots;

import { createWritingFeed } from "@/lib/rss.ts";

const GET = async (): Promise<Response> =>
  new Response(await createWritingFeed(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });

const dynamic = "force-static";

export { dynamic, GET };

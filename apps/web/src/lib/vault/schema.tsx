import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { format } from "date-fns/fp";
import Link from "next/link";
import { date, list, text } from "obsid/property";
import { ObsidianMarkdown } from "obsid/react";
import { defineObsidSchema } from "obsid/schema";
import type { StringPropertyValue } from "obsid/types";
import { webPermalink } from "@/lib/vault/routing.ts";

const renderTitle = (title: StringPropertyValue | undefined): string | null => {
  if (!title) {
    return null;
  }

  if (title.type === "string") {
    return title.value;
  }

  if (title.type === "link") {
    return title.label ?? title.url;
  }

  return title.label ?? title.path;
};

const getNoteTitle = (vaultPath: string, title: StringPropertyValue | undefined): string =>
  renderTitle(title) ?? vaultPath.slice(vaultPath.lastIndexOf("/") + 1);

const schema = defineObsidSchema({
  defaultType: "page",
  // globalProperties: { ... }
  // globalMetadata: { ... }
  registry: {
    "link-list": {
      properties: {
        date: date().optional(),
        description: text().optional(),
        directories: list().optional(),
        list: list().optional(),
        rating: text().optional(),
        slug: text().optional(),
        title: text().optional(),
        where: text().optional(),
      },
      renderer: ({ title }) => renderTitle(title),
    },
    page: {
      properties: {
        slug: text().optional(),
        title: text().optional(),
      },
      renderer: (_properties, { markdown }) => <ObsidianMarkdown>{markdown}</ObsidianMarkdown>,
      // metadata: { //example
      //   title: "title",
      //   slug: "slug"
      // }
    },
    post: {
      properties: {
        date: date(),
        title: text().optional(),
      },
      renderer: async (properties, { markdown, title, resolveFolder, currentFolder }) => {
        const notes = await resolveFolder(currentFolder);
        const parent = notes.find((note) => note.pageType === "postList");
        if (parent === undefined) {
          throw new Error(`Missing post list for ${currentFolder.vaultPath}`);
        }
        return (
          <div className="flex flex-col gap-2 items-start">
            <Link
              className="inline-flex items-center gap-1 text-sm hover:underline mb-3"
              href={parent.webPath}
            >
              <ArrowLeftIcon />
              <span>Posts</span>
            </Link>
            <h1 className="font-sans font-stretch-semi-condensed font-bold text-3xl">{title}</h1>
            <span className="mb-4 text-neutral-700">{format("do MMMM y", properties.date)}</span>
            <ObsidianMarkdown>{markdown}</ObsidianMarkdown>
          </div>
        );
      },
    },
    postList: {
      properties: {},
      renderer: async (_properties, { currentFolder, resolveFolder }) => {
        const notes = await resolveFolder(currentFolder);
        const posts = notes.filter((note) => note.pageType === "post");

        return (
          <ul className="flex flex-col items-start gap-0 w-full">
            {posts
              .toSorted(
                (left, right) => right.properties.date.getTime() - left.properties.date.getTime(),
              )
              .map((post) => (
                <li className="w-full" key={post.vaultPath}>
                  <Link
                    className="flex justify-between items-center w-full group pb-4"
                    href={post.webPath}
                  >
                    <span className="group-hover:underline underline-offset-2 decoration-1">
                      {getNoteTitle(post.vaultPath, post.properties.title)}
                    </span>
                    <div className="w-full flex-1 border-b-1 -mt-2 border-neutral-100 group-hover:border-neutral-800">
                      <span className="no-underline hover:no-underline">&nbsp;</span>
                    </div>
                    <span className="group-hover:bg-black group-hover:text-white bg-neutral-200 border-neutral-200 px-2 pt-0.5 flex justify-end -mt-1.5 border-b group-hover:border-black">
                      <span className="text-sm">{format("do LLLL y", post.properties.date)}</span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        );
      },
    },
  },
  routing: {
    permalink: webPermalink,
  },
  typeIdentifier: "type",
});

// biome-ignore lint/style/noDefaultExport: The configured schema path resolves one conventional module value.
export default schema;

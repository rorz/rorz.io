import { expect, test } from "bun:test";
import { text } from "../property/index.ts";
import { defineObsidSchema, renderObsidPage } from "./schema.ts";

test("renderObsidPage dispatches content and tools to the selected renderer", async () => {
  const schema = defineObsidSchema({
    defaultType: "page",
    registry: {
      page: {
        properties: {
          title: text(),
        },
        renderer: async ({ title }, { currentFolder, markdown, sortBy, title: noteTitle }) => {
          if (title.type !== "string") {
            throw new Error("Expected a plain text title");
          }

          const prefix = await Promise.resolve("Rendered");
          const ordered = sortBy(
            [
              {
                label: "second",
                properties: {
                  position: 2,
                },
              },
              {
                label: "first",
                properties: {
                  position: 1,
                },
              },
            ],
            "position",
          );

          return `${prefix} ${noteTitle} from ${currentFolder.vaultPath}: ${title.value} (${ordered[0]?.label})\n${markdown}`;
        },
      },
    },
  });

  const rendered = await renderObsidPage(schema, {
    body: "# Body",
    currentFolder: {
      kind: "folder",
      vaultPath: "posts",
    },
    pageType: "page",
    properties: {
      title: {
        raw: "Hello",
        type: "string",
        value: "Hello",
      },
    },
    resolveFolder: () => Promise.resolve([]),
    resolveNote: () => Promise.resolve(null),
    vaultPath: "posts/page",
    webPath: "/posts",
  });

  expect(rendered).toBe("Rendered page from posts: Hello (first)\n# Body");
});

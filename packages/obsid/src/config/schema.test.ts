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
        renderer: async ({ title }, { currentFolder, markdown }) => {
          if (title.type !== "string") {
            throw new Error("Expected a plain text title");
          }

          const prefix = await Promise.resolve("Rendered");
          return `${prefix} from ${currentFolder.path}: ${title.value}\n${markdown}`;
        },
      },
    },
  });

  const rendered = await renderObsidPage(schema, {
    body: "# Body",
    currentFolder: {
      kind: "folder",
      path: "posts",
    },
    pageType: "page",
    path: "page",
    properties: {
      title: {
        raw: "Hello",
        type: "string",
        value: "Hello",
      },
    },
    resolveFolder: () => Promise.resolve([]),
    resolveNote: () => Promise.resolve(null),
  });

  expect(rendered).toBe("Rendered from posts: Hello\n# Body");
});

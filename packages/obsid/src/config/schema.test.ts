import { expect, test } from "bun:test";
import { p } from "../property/index.ts";
import { getFileFromLoaders } from "../vault/file-store.ts";
import { defineSchema, note, renderObsidPage } from "./schema.ts";

test("renderObsidPage dispatches the resolved note and its query", async () => {
  const page = note("page", {
    title: p.text(),
  });
  const model = defineSchema({
    default: page,
    notes: [
      page,
    ],
  });
  const schema = model.render({
    page: async ({ note: current, query }) => {
      const prefix = await Promise.resolve("Rendered");
      const siblings = await query.findMany({
        folder: current.folder,
        kind: "page",
      });

      const title =
        current.properties.title.type === "string"
          ? current.properties.title.value
          : current.properties.title.raw;

      return `${prefix} ${title} from ${current.folder.vaultPath} (${siblings.length})\n${current.body}`;
    },
  });
  const resolved = await getFileFromLoaders(
    {
      "/.obsidian-vaults/notes/posts/page.md": () =>
        Promise.resolve(`---
title: Hello
---
# Body`),
    },
    "./.obsidian-vaults/",
    "notes",
    "posts/page",
    schema,
  );

  if (!resolved) {
    throw new Error("Expected page to resolve");
  }

  expect(await renderObsidPage(schema, resolved)).toBe("Rendered Hello from posts (1)\n# Body");
});

test("schema construction rejects duplicate note names", () => {
  const first = note("page", {});
  const second = note("page", {});

  expect(() =>
    defineSchema({
      default: first,
      notes: [
        first,
        second,
      ],
    }),
  ).toThrow("Schema note names must be unique");
});

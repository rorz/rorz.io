import { expect, test } from "bun:test";
import { defineObsidSchema } from "../config/schema.ts";
import { list } from "../property/index.ts";
import { getFileFromLoaders } from "./file-store.ts";

test("resolves notes and folders from the current vault", async () => {
  const schema = defineObsidSchema({
    defaultType: "page",
    registry: {
      page: {
        properties: {
          children: list().optional(),
        },
        renderer: () => null,
      },
    },
  });
  const parent = await getFileFromLoaders(
    {
      "/.obsidian-vaults/rorz.io/section/children/Alpha.md": () => Promise.resolve("Alpha"),
      "/.obsidian-vaults/rorz.io/section/children/nested/Ignored.md": () =>
        Promise.resolve("Ignored"),
      "/.obsidian-vaults/rorz.io/section/children/Zebra.md": () => Promise.resolve("Zebra"),
      "/.obsidian-vaults/rorz.io/section/Parent.md": () =>
        Promise.resolve(`---
children:
  - "[[section/children/Alpha]]"
---
Parent`),
    },
    "./.obsidian-vaults/",
    "rorz.io",
    "section/Parent",
    schema,
  );

  if (!parent) {
    throw new Error("Expected parent page to load");
  }

  const [childReference] = parent.properties.children ?? [];

  if (childReference?.type !== "note") {
    throw new Error("Expected a note property");
  }

  const child = await parent.resolveNote(childReference);

  if (!child) {
    throw new Error("Expected child page to resolve");
  }

  expect(parent.currentFolder).toEqual({
    kind: "folder",
    path: "section",
  });
  expect(child.path).toBe("section/children/Alpha");
  expect((await parent.resolveFolder(child.currentFolder)).map((note) => note.path)).toEqual([
    "section/children/Alpha",
    "section/children/Zebra",
  ]);
});

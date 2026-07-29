import { expect, test } from "bun:test";
import { defineObsidSchema, sortBy } from "../config/schema.ts";
import { date, list } from "../property/index.ts";
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
    vaultPath: "section",
  });
  expect(child.vaultPath).toBe("section/children/Alpha");
  expect(child.webPath).toBe("/section/children/alpha");
  expect((await parent.resolveFolder(child.currentFolder)).map((note) => note.vaultPath)).toEqual([
    "section/children/Alpha",
    "section/children/Zebra",
  ]);
});

test("filters a resolved folder by page type and narrows its notes", async () => {
  const schema = defineObsidSchema({
    defaultType: "page",
    registry: {
      journal: {
        properties: {
          date: date(),
        },
        renderer: () => null,
      },
      page: {
        properties: {},
        renderer: () => null,
      },
    },
    typeIdentifier: "type",
  });
  const parent = await getFileFromLoaders(
    {
      "/.obsidian-vaults/rorz.io/section/Earlier.md": () =>
        Promise.resolve(`---
type: journal
date: 2027-01-01
---
Earlier`),
      "/.obsidian-vaults/rorz.io/section/Journal.md": () =>
        Promise.resolve(`---
type: journal
date: 2026-07-28
---
Journal`),
      "/.obsidian-vaults/rorz.io/section/Page.md": () => Promise.resolve("Page"),
      "/.obsidian-vaults/rorz.io/section/Parent.md": () => Promise.resolve("Parent"),
    },
    "./.obsidian-vaults/",
    "rorz.io",
    "section/Parent",
    schema,
  );

  if (!parent) {
    throw new Error("Expected parent page to load");
  }

  const journals = await parent.resolveFolder(parent.currentFolder, "journal");

  expect(journals.map((note) => note.vaultPath)).toEqual([
    "section/Earlier",
    "section/Journal",
  ]);
  const journalsByDate = sortBy(journals, "date");

  expect(journalsByDate.map((note) => note.vaultPath)).toEqual([
    "section/Journal",
    "section/Earlier",
  ]);

  const [journal] = journalsByDate;

  if (!journal) {
    throw new Error("Expected a journal page to resolve");
  }

  const publishedAt: Date = journal.properties.date;

  expect(publishedAt).toEqual(new Date("2026-07-28"));
});

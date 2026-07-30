import { expect, test } from "bun:test";
import { defineSchema, desc, note, p } from "../config/schema.ts";
import { getFileFromLoaders } from "./file-store.ts";

test("resolves typed note references and folders from the current vault", async () => {
  const child = note("child", {});
  const page = note("page", {
    children: p.ref(child).array().optional(),
  });
  const schema = defineSchema({
    default: page,
    discriminator: "type",
    notes: [
      child,
      page,
    ],
  });
  const parent = await getFileFromLoaders(
    {
      "/.obsidian-vaults/rorz.io/section/children/Alpha.md": () =>
        Promise.resolve(`---
type: child
---
Alpha`),
      "/.obsidian-vaults/rorz.io/section/children/nested/Ignored.md": () =>
        Promise.resolve("Ignored"),
      "/.obsidian-vaults/rorz.io/section/children/Zebra.md": () =>
        Promise.resolve(`---
type: child
---
Zebra`),
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

  const [childReference] = parent.data.children ?? [];

  if (!childReference) {
    throw new Error("Expected a child reference");
  }

  const resolvedChild = await parent.query.resolve(childReference);

  if (!resolvedChild) {
    throw new Error("Expected child page to resolve");
  }

  const childKind: "child" = resolvedChild.kind;

  expect(childKind).toBe("child");
  expect(parent.folder).toEqual({
    kind: "folder",
    vaultPath: "section",
  });
  expect(resolvedChild.vaultPath).toBe("section/children/Alpha");
  expect(resolvedChild.webPath).toBe("/section/children/alpha");
  expect(
    (
      await parent.query.findMany({
        folder: resolvedChild.folder,
        kind: "child",
      })
    ).map((resolved) => resolved.vaultPath),
  ).toEqual([
    "section/children/Alpha",
    "section/children/Zebra",
  ]);
});

test("findMany narrows, orders, and limits notes by kind", async () => {
  const journal = note("journal", {
    date: p.date(),
  });
  const page = note("page", {});
  const schema = defineSchema({
    default: page,
    discriminator: "type",
    notes: [
      journal,
      page,
    ],
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

  const journals = await parent.query.findMany({
    folder: parent.folder,
    kind: "journal",
    limit: 1,
    orderBy: ({ data }) => desc(data.date),
  });

  expect(journals.map((resolved) => resolved.vaultPath)).toEqual([
    "section/Earlier",
  ]);

  const [first] = journals;

  if (!first) {
    throw new Error("Expected a journal page to resolve");
  }

  const publishedAt: Date = first.data.date;

  expect(publishedAt).toEqual(new Date("2027-01-01"));
});

test("resolve rejects a reference whose target kind does not match", async () => {
  const child = note("child", {});
  const page = note("page", {});
  const parentDefinition = note("parent", {
    child: p.ref(child),
  });
  const schema = defineSchema({
    default: page,
    discriminator: "type",
    notes: [
      child,
      page,
      parentDefinition,
    ],
  });
  const parent = await getFileFromLoaders(
    {
      "/.obsidian-vaults/rorz.io/Child.md": () => Promise.resolve("Wrong kind"),
      "/.obsidian-vaults/rorz.io/Parent.md": () =>
        Promise.resolve(`---
type: parent
child: "[[Child]]"
---
Parent`),
    },
    "./.obsidian-vaults/",
    "rorz.io",
    "Parent",
    schema,
  );

  if (!parent) {
    throw new Error("Expected parent page to load");
  }

  await expect(parent.query.resolve(parent.data.child)).rejects.toThrow(
    'expected kind "child" but resolved "page"',
  );
});

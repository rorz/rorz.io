import { describe, expect, test } from "bun:test";
import { defineSchema, note } from "../config/schema.ts";
import { getFileFromLoaders } from "./file-store.ts";

const page = note("page", {});
const schema = defineSchema({
  default: page,
  notes: [
    page,
  ],
});

describe("VaultFile resolved links", () => {
  test("parses frontmatter and resolves links to unique files", async () => {
    const articlePath = "/.obsidian-vaults/rorz.io/lists/best/New York-style pizza (whole).md";
    const source = `---
where: "[[Lauretta's]]"
description: "Near [[Lauretta's]]"
---
Only sells whole pies, but`;
    const file = await getFileFromLoaders(
      {
        [articlePath]: () => Promise.resolve(source),
        "/.obsidian-vaults/rorz.io/lists/food/Lauretta's.md": () => Promise.resolve("# Lauretta's"),
      },
      "./.obsidian-vaults/",
      "rorz.io",
      "lists/best/New York-style pizza (whole)",
      schema,
    );

    expect(file).toEqual({
      body: "Only sells whole pies, but",
      folder: {
        kind: "folder",
        vaultPath: "lists/best",
      },
      frontmatter: {
        description: "Near [[Lauretta's]]",
        where: {
          label: "Lauretta's",
          resolvedPath: "lists/food/Lauretta's",
          target: "Lauretta's",
          type: "link",
        },
      },
      kind: "page",
      links: [
        {
          label: "Lauretta's",
          resolvedPath: "lists/food/Lauretta's",
          target: "Lauretta's",
          type: "link",
        },
      ],
      name: "New York-style pizza (whole)",
      properties: {},
      query: {
        findMany: expect.any(Function),
        resolve: expect.any(Function),
        resolveOrThrow: expect.any(Function),
      },
      source,
      vaultPath: "lists/best/New York-style pizza (whole)",
      webPath: "/lists/best/new-york-style-pizza-whole",
    });
  });
});

describe("VaultFile unresolved links", () => {
  test("keeps unresolved and ambiguous links explicit", async () => {
    const file = await getFileFromLoaders(
      {
        "/.obsidian-vaults/rorz.io/Article.md": () =>
          Promise.resolve("See [[Missing]] and [[Duplicate]]."),
        "/.obsidian-vaults/rorz.io/one/Duplicate.md": () => Promise.resolve("One"),
        "/.obsidian-vaults/rorz.io/two/Duplicate.md": () => Promise.resolve("Two"),
      },
      "./.obsidian-vaults/",
      "rorz.io",
      "Article",
      schema,
    );

    expect(file?.links).toEqual([
      {
        label: "Missing",
        resolvedPath: null,
        target: "Missing",
        type: "link",
      },
      {
        label: "Duplicate",
        resolvedPath: null,
        target: "Duplicate",
        type: "link",
      },
    ]);
  });
});

describe("VaultFile frontmatter links", () => {
  test("groups link lists by field and preserves aliases", async () => {
    const source = `---
directories:
  - "[[page--projects|Projects]]"
  - "[[lists/page|Lists]]"
  - "[[about/page|About]]"
---
Home`;
    const file = await getFileFromLoaders(
      {
        "/.obsidian-vaults/rorz.io/about/page.md": () => Promise.resolve("About"),
        "/.obsidian-vaults/rorz.io/lists/page.md": () => Promise.resolve("Lists"),
        "/.obsidian-vaults/rorz.io/page.md": () => Promise.resolve(source),
        "/.obsidian-vaults/rorz.io/projects/page--projects.md": () => Promise.resolve("Projects"),
      },
      "./.obsidian-vaults/",
      "rorz.io",
      "page",
      schema,
    );

    if (!file) {
      throw new Error("Expected page to load");
    }

    expect(file.frontmatter.directories).toEqual([
      {
        label: "Projects",
        resolvedPath: "projects/page--projects",
        target: "page--projects",
        type: "link",
      },
      {
        label: "Lists",
        resolvedPath: "lists/page",
        target: "lists/page",
        type: "link",
      },
      {
        label: "About",
        resolvedPath: "about/page",
        target: "about/page",
        type: "link",
      },
    ]);
  });
});

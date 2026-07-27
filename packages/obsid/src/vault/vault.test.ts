import { describe, expect, test } from "bun:test";
import { defineObsidSchema } from "../config/schema.ts";
import { getFileFromLoaders, getVaultFromLoaders } from "./file-store.ts";
import type { VaultConfig } from "./types.ts";

const schema = defineObsidSchema({
  defaultType: "page",
  registry: {
    page: {
      properties: {},
      renderer: () => null,
    },
  },
});

describe("getVault", () => {
  test("binds a configured vault and its custom folder", async () => {
    const config = {
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./content/vaults/",
    } as const;
    const vault = getVaultFromLoaders(
      {
        "/content/vaults/notes/Welcome.md": () => Promise.resolve("# Welcome"),
      },
      config,
      schema,
      "notes",
    );

    expect(vault.name).toBe("notes");
    expect(vault.paths).toEqual([
      "Welcome",
    ]);
    expect(await vault.getFile("Welcome")).toEqual({
      body: "# Welcome",
      currentFolder: {
        kind: "folder",
        path: "",
      },
      frontmatter: {},
      links: [],
      pageType: "page",
      path: "Welcome",
      properties: {},
      resolveFolder: expect.any(Function),
      resolveNote: expect.any(Function),
      source: "# Welcome",
    });
  });

  test("rejects a vault that is not configured", () => {
    const config: VaultConfig = {
      vaults: [],
      vaultsFolder: "./.obsidian-vaults/",
    };

    expect(() => getVaultFromLoaders({}, config, schema, "missing")).toThrow(
      "Unknown vault: missing",
    );
  });
});

describe("Vault paths", () => {
  test("exposes sorted extensionless source paths without loading files", () => {
    let loads = 0;
    const config = {
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./content/vaults/",
    } as const;
    const vault = getVaultFromLoaders(
      {
        "/content/vaults/notes/nested/Alpha.md": () => {
          loads += 1;
          return Promise.resolve("Alpha");
        },
        "/content/vaults/notes/Zebra.md": () => {
          loads += 1;
          return Promise.resolve("Zebra");
        },
        "/content/vaults/other/Ignored.md": () => Promise.resolve("Ignored"),
      },
      config,
      schema,
      "notes",
    );

    expect(vault.paths).toEqual([
      "Zebra",
      "nested/Alpha",
    ]);
    expect(loads).toBe(0);
  });
});

describe("getFolder", () => {
  test("loads direct Markdown children in path order", async () => {
    const loadedPaths: string[] = [];
    const config = {
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./content/vaults/",
    } as const;
    const vault = getVaultFromLoaders(
      {
        "/content/vaults/notes/posts/Alpha.md": () => {
          loadedPaths.push("posts/Alpha");
          return Promise.resolve("Alpha");
        },
        "/content/vaults/notes/posts/nested/Ignored.md": () => {
          loadedPaths.push("posts/nested/Ignored");
          return Promise.resolve("Ignored");
        },
        "/content/vaults/notes/posts/Zebra.md": () => {
          loadedPaths.push("posts/Zebra");
          return Promise.resolve("Zebra");
        },
        "/content/vaults/notes/Root.md": () => {
          loadedPaths.push("Root");
          return Promise.resolve("Root");
        },
      },
      config,
      schema,
      "notes",
    );

    const files = await vault.getFolder("/posts/");

    expect(files.map((file) => file.path)).toEqual([
      "posts/Alpha",
      "posts/Zebra",
    ]);
    expect(loadedPaths).toEqual([
      "posts/Alpha",
      "posts/Zebra",
    ]);
  });
});

describe("getFolder path handling", () => {
  test("supports the vault root and rejects unsafe paths", async () => {
    const config = {
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./content/vaults/",
    } as const;
    const vault = getVaultFromLoaders(
      {
        "/content/vaults/notes/nested/Child.md": () => Promise.resolve("Child"),
        "/content/vaults/notes/Root.md": () => Promise.resolve("Root"),
      },
      config,
      schema,
      "notes",
    );

    expect((await vault.getFolder("")).map((file) => file.path)).toEqual([
      "Root",
    ]);
    expect(await vault.getFolder("../notes")).toEqual([]);
    expect(await vault.getFolder("nested//child")).toEqual([]);
  });
});

describe("getFile", () => {
  test("loads one exact Markdown file lazily", async () => {
    let loads = 0;
    const file = await getFileFromLoaders(
      {
        "/.obsidian-vaults/rorz.io/Welcome.md": () => {
          loads += 1;
          return Promise.resolve("# Welcome");
        },
      },
      "./.obsidian-vaults/",
      "rorz.io",
      "/Welcome.md",
      schema,
    );

    expect(loads).toBe(1);
    expect(file?.path).toBe("Welcome");
    expect(file?.source).toBe("# Welcome");
  });

  test("returns null for missing files and unsafe vault or file paths", async () => {
    expect(
      await getFileFromLoaders({}, "./.obsidian-vaults/", "rorz.io", "Missing", schema),
    ).toBeNull();
    expect(
      await getFileFromLoaders({}, "./.obsidian-vaults/", "../rorz.io", "Welcome", schema),
    ).toBeNull();
    expect(
      await getFileFromLoaders({}, "./.obsidian-vaults/", "rorz.io", "../Welcome", schema),
    ).toBeNull();
    expect(
      await getFileFromLoaders({}, "./.obsidian-vaults/", "rorz.io", "folder//Welcome", schema),
    ).toBeNull();
    expect(await getFileFromLoaders({}, "../vaults", "rorz.io", "Welcome", schema)).toBeNull();
  });
});

describe("VaultFile metadata", () => {
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
      currentFolder: {
        kind: "folder",
        path: "lists/best",
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
      links: [
        {
          label: "Lauretta's",
          resolvedPath: "lists/food/Lauretta's",
          target: "Lauretta's",
          type: "link",
        },
      ],
      pageType: "page",
      path: "lists/best/New York-style pizza (whole)",
      properties: {},
      resolveFolder: expect.any(Function),
      resolveNote: expect.any(Function),
      source,
    });
  });

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

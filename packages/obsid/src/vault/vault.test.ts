import { describe, expect, test } from "bun:test";
import { getFileFromLoaders, getVaultFromLoaders } from "./file-store.ts";
import type { VaultConfig } from "./types.ts";

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
      "notes",
    );

    expect(vault.name).toBe("notes");
    expect(await vault.getFile("Welcome")).toEqual({
      body: "# Welcome",
      frontmatter: {},
      links: [],
      path: "Welcome",
      source: "# Welcome",
    });
  });

  test("rejects a vault that is not configured", () => {
    const config: VaultConfig = {
      vaults: [],
      vaultsFolder: "./.obsidian-vaults/",
    };

    expect(() => getVaultFromLoaders({}, config, "missing")).toThrow("Unknown vault: missing");
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
    );

    expect(loads).toBe(1);
    expect(file?.path).toBe("Welcome");
    expect(file?.source).toBe("# Welcome");
  });

  test("returns null for missing files and unsafe vault or file paths", async () => {
    expect(await getFileFromLoaders({}, "./.obsidian-vaults/", "rorz.io", "Missing")).toBeNull();
    expect(await getFileFromLoaders({}, "./.obsidian-vaults/", "../rorz.io", "Welcome")).toBeNull();
    expect(await getFileFromLoaders({}, "./.obsidian-vaults/", "rorz.io", "../Welcome")).toBeNull();
    expect(
      await getFileFromLoaders({}, "./.obsidian-vaults/", "rorz.io", "folder//Welcome"),
    ).toBeNull();
    expect(await getFileFromLoaders({}, "../vaults", "rorz.io", "Welcome")).toBeNull();
  });
});

describe("VaultFile metadata", () => {
  test("parses frontmatter and resolves links to unique files", async () => {
    const articlePath = "/.obsidian-vaults/rorz.io/lists/best/New York-style pizza (whole).md";
    const source = `---
where: "[[Lauretta's]]"
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
    );

    expect(file).toEqual({
      body: "Only sells whole pies, but",
      frontmatter: {
        where: "[[Lauretta's]]",
      },
      links: [
        {
          resolvedPath: "lists/food/Lauretta's",
          target: "Lauretta's",
        },
      ],
      path: "lists/best/New York-style pizza (whole)",
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
    );

    expect(file?.links).toEqual([
      {
        resolvedPath: null,
        target: "Missing",
      },
      {
        resolvedPath: null,
        target: "Duplicate",
      },
    ]);
  });
});

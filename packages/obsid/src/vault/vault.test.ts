import { describe, expect, test } from "bun:test";
import { defineSchema, note } from "../config/schema.ts";
import { getFileFromLoaders, getVaultFromLoaders } from "./file-store.ts";
import type { VaultConfig } from "./types.ts";

const page = note("page", {});
const schema = defineSchema({
  default: page,
  notes: [
    page,
  ],
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
    expect(vault.vaultPaths).toEqual([
      "Welcome",
    ]);
    expect(await vault.getFile("Welcome")).toEqual({
      body: "# Welcome",
      folder: {
        kind: "folder",
        vaultPath: "",
      },
      frontmatter: {},
      kind: "page",
      links: [],
      name: "Welcome",
      properties: {},
      query: {
        findMany: expect.any(Function),
        resolve: expect.any(Function),
        resolveOrThrow: expect.any(Function),
      },
      resolveImage: expect.any(Function),
      source: "# Welcome",
      vaultPath: "Welcome",
      webPath: "/welcome",
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

    expect(vault.vaultPaths).toEqual([
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

    expect(files.map((file) => file.vaultPath)).toEqual([
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

    expect((await vault.getFolder("")).map((file) => file.vaultPath)).toEqual([
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
    expect(file?.vaultPath).toBe("Welcome");
    expect(file?.webPath).toBe("/welcome");
    expect(file?.source).toBe("# Welcome");
  });

  test("resolves a local image to its bundled URL", async () => {
    const file = await getFileFromLoaders(
      {
        "/.obsidian-vaults/rorz.io/posts/Welcome.md": () =>
          Promise.resolve("![[images/an_image.png]]"),
      },
      "./.obsidian-vaults/",
      "rorz.io",
      "posts/Welcome",
      schema,
      {
        "/.obsidian-vaults/rorz.io/images/an_image.png": "/assets/an_image.123.png",
      },
    );

    expect(file?.resolveImage("an_image.png")).toBe("/assets/an_image.123.png");
    expect(file?.resolveImage("images/an_image.png")).toBe("/assets/an_image.123.png");
    expect(file?.resolveImage("missing.png")).toBeNull();
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

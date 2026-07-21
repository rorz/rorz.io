import { describe, expect, test } from "bun:test";
import { getFileFromLoaders, getVaultFromLoaders, type VaultConfig } from "./file-store.ts";

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

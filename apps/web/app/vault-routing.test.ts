import { describe, expect, test } from "bun:test";
import type { Vault, VaultFile, VaultFrontmatter } from "obsid/vault";
import { createVaultRouteManifest, slugifySegment } from "./vault-routing.ts";

const createFile = (path: string, frontmatter: VaultFrontmatter = {}): VaultFile => ({
  body: "",
  frontmatter,
  links: [],
  path,
  source: "",
});

const createVault = (files: readonly VaultFile[]): Vault => {
  const filesByPath = new Map(
    files.map((file) => [
      file.path,
      file,
    ]),
  );

  return {
    getFile: (path) => Promise.resolve(filesByPath.get(path) ?? null),
    getFolder: () => Promise.resolve([]),
    name: "test",
    paths: files.map((file) => file.path),
  };
};

describe("slugifySegment", () => {
  test("creates lowercase hyphenated URL segments", () => {
    expect(slugifySegment("New York-style pizza (whole)")).toBe("new-york-style-pizza-whole");
    expect(slugifySegment("Lauretta's")).toBe("laurettas");
    expect(slugifySegment("Crème brûlée")).toBe("creme-brulee");
  });
});

describe("createVaultRouteManifest paths", () => {
  test("maps source paths to clean routes and treats page files as directory pages", async () => {
    const manifest = await createVaultRouteManifest(
      createVault([
        createFile("page"),
        createFile("about/page"),
        createFile("projects/page--projects"),
        createFile("lists/best/New York-style pizza (whole)"),
      ]),
    );

    expect(
      manifest.routes.map(({ routePath, sourcePath }) => [
        sourcePath,
        routePath,
      ]),
    ).toEqual([
      [
        "page",
        "",
      ],
      [
        "about/page",
        "about",
      ],
      [
        "lists/best/New York-style pizza (whole)",
        "lists/best/new-york-style-pizza-whole",
      ],
      [
        "projects/page--projects",
        "projects",
      ],
    ]);
    expect(manifest.getBySegments()?.sourcePath).toBe("page");
    expect(
      manifest.getBySegments([
        "about",
      ])?.sourcePath,
    ).toBe("about/page");
    expect(manifest.getHref("projects/page--projects")).toBe("/projects");
    expect(manifest.getHref("missing")).toBeNull();
  });
});

describe("createVaultRouteManifest overrides and collisions", () => {
  test("uses a frontmatter slug for the final URL segment", async () => {
    const manifest = await createVaultRouteManifest(
      createVault([
        createFile("lists/New York-style pizza", {
          slug: "Best Pizza",
        }),
      ]),
    );

    expect(manifest.routes[0]).toEqual({
      href: "/lists/best-pizza",
      routePath: "lists/best-pizza",
      segments: [
        "lists",
        "best-pizza",
      ],
      sourcePath: "lists/New York-style pizza",
    });
  });

  test("rejects routes that collide after slugification", async () => {
    const manifest = createVaultRouteManifest(
      createVault([
        createFile("Hello World"),
        createFile("hello-world"),
      ]),
    );

    await expect(manifest).rejects.toThrow(
      "Vault route collision at /hello-world: Hello World.md and hello-world.md",
    );
  });
});

import { describe, expect, test } from "bun:test";
import type { Vault } from "obsid/vault";
import { createVaultRouteManifest, slugifySegment } from "./routing.ts";

const createVault = (paths: readonly string[]): Pick<Vault, "paths"> => ({
  paths,
});

describe("slugifySegment", () => {
  test("creates lowercase hyphenated URL segments", () => {
    expect(slugifySegment("New York-style pizza (whole)")).toBe("new-york-style-pizza-whole");
    expect(slugifySegment("Lauretta's")).toBe("laurettas");
    expect(slugifySegment("Crème brûlée")).toBe("creme-brulee");
  });
});

describe("createVaultRouteManifest paths", () => {
  test("maps source paths to clean routes and treats page files as directory pages", () => {
    const manifest = createVaultRouteManifest(
      createVault([
        "page",
        "about/page",
        "projects/page--projects",
        "lists/best/New York-style pizza (whole)",
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

describe("createVaultRouteManifest collisions", () => {
  test("rejects routes that collide after slugification", () => {
    expect(() =>
      createVaultRouteManifest(
        createVault([
          "Hello World",
          "hello-world",
        ]),
      ),
    ).toThrow("Vault route collision at /hello-world: Hello World.md and hello-world.md");
  });
});

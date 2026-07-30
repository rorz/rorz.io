import { describe, expect, test } from "bun:test";
import { defineSchema, note } from "obsid/schema";
import type { Vault } from "obsid/vault";
import { createVaultRouteManifest, webPermalink } from "./routing.ts";

const page = note("page", {});
const schema = defineSchema({
  default: page,
  notes: [
    page,
  ],
  routing: {
    permalink: webPermalink,
  },
});

const createVault = (vaultPaths: readonly string[]): Pick<Vault, "vaultPaths"> => ({
  vaultPaths,
});

describe("createVaultRouteManifest paths", () => {
  test("maps vault paths to web paths and treats page files as directory pages", () => {
    const manifest = createVaultRouteManifest(
      createVault([
        "page",
        "about/page",
        "projects/page--projects",
        "lists/best/New York-style pizza (whole)",
      ]),
      schema,
    );

    expect(
      manifest.routes.map(({ vaultPath, webPath }) => [
        vaultPath,
        webPath,
      ]),
    ).toEqual([
      [
        "page",
        "/",
      ],
      [
        "about/page",
        "/about",
      ],
      [
        "lists/best/New York-style pizza (whole)",
        "/lists/best/new-york-style-pizza-whole",
      ],
      [
        "projects/page--projects",
        "/projects",
      ],
    ]);
    expect(manifest.getBySegments()?.vaultPath).toBe("page");
    expect(
      manifest.getBySegments([
        "about",
      ])?.vaultPath,
    ).toBe("about/page");
    expect(manifest.getWebPath("projects/page--projects")).toBe("/projects");
    expect(manifest.getWebPath("missing")).toBeNull();
  });
});

describe("createVaultRouteManifest collisions", () => {
  test("rejects colliding web paths", () => {
    expect(() =>
      createVaultRouteManifest(
        createVault([
          "Hello World",
          "hello-world",
        ]),
        schema,
      ),
    ).toThrow("Vault route collision at /hello-world: Hello World.md and hello-world.md");
  });
});

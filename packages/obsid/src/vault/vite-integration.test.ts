import { expect, test } from "bun:test";
import { build, type Plugin } from "vite";
import { obsid } from "../vite/index.ts";

test("Vite replaces the vault glob in the public vault entry", async () => {
  const virtualId = "virtual:obsidian-vault-test";
  const resolvedId = `\0${virtualId}`;
  const entryPlugin: Plugin = {
    load(id) {
      if (id === resolvedId) {
        return [
          'import { getVault } from "obsid/vault";',
          'import { defineSchema, note } from "obsid/schema";',
          'const page = note("page", {}); const schema = defineSchema({ default: page, notes: [page] });',
          'void getVault({ vaultsFolder: "./.obsidian-vaults/", vaults: [{ name: "rorz.io" }] }, schema, "rorz.io").getFile("__missing__");',
        ].join("\n");
      }
    },
    name: "obsidian-vault-test",
    resolveId(id) {
      if (id === virtualId) {
        return resolvedId;
      }
    },
  };
  const result = await build({
    build: {
      rollupOptions: {
        input: virtualId,
      },
      write: false,
    },
    configFile: false,
    logLevel: "silent",
    plugins: [
      obsid({
        vaults: [
          {
            name: "rorz.io",
          },
        ],
        vaultsFolder: "./.obsidian-vaults/",
      }),
      entryPlugin,
    ],
    root: new URL("../../../../apps/web/", import.meta.url).pathname,
  });

  if (!(Array.isArray(result) || "output" in result)) {
    throw new Error("Expected a completed Vite build.");
  }

  const builds = Array.isArray(result)
    ? result
    : [
        result,
      ];
  const bundledCode = builds
    .flatMap((buildResult) => buildResult.output)
    .filter((output) => output.type === "chunk")
    .map((output) => output.code)
    .join("\n");

  expect(bundledCode).not.toContain("import.meta.glob");
});

test("Vite exposes local vault images as bundled asset URLs", async () => {
  const virtualId = "virtual:obsidian-image-test";
  const resolvedId = `\0${virtualId}`;
  const entryPlugin: Plugin = {
    load(id) {
      if (id === resolvedId) {
        return [
          'import { vaultImages } from "virtual:obsid/vault-files";',
          "globalThis.__vaultImages = vaultImages;",
        ].join("\n");
      }
    },
    name: "obsidian-image-test",
    resolveId(id) {
      if (id === virtualId) {
        return resolvedId;
      }
    },
  };
  const result = await build({
    build: {
      rollupOptions: {
        input: virtualId,
      },
      write: false,
    },
    configFile: false,
    logLevel: "silent",
    plugins: [
      obsid({
        vaults: [
          {
            name: "notes",
          },
        ],
        vaultsFolder: "./vaults/",
      }),
      entryPlugin,
    ],
    root: new URL("./fixtures/vite-assets/", import.meta.url).pathname,
  });

  if (!(Array.isArray(result) || "output" in result)) {
    throw new Error("Expected a completed Vite build.");
  }

  const builds = Array.isArray(result)
    ? result
    : [
        result,
      ];
  const bundledCode = builds
    .flatMap((buildResult) => buildResult.output)
    .filter((output) => output.type === "chunk")
    .map((output) => output.code)
    .join("\n");

  expect(bundledCode).toContain("/vaults/notes/an_image.svg");
  expect(bundledCode).not.toContain("import.meta.glob");
});

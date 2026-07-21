import { expect, test } from "bun:test";
import { build, type Plugin } from "vite";
import { obsid } from "../vite/index.ts";

test("Vite replaces the vault glob in the public renderer entry", async () => {
  const virtualId = "virtual:obsidian-renderer-test";
  const resolvedId = `\0${virtualId}`;
  const entryPlugin: Plugin = {
    load(id) {
      if (id === resolvedId) {
        return [
          'import { getVault } from "obsid/renderer";',
          'void getVault({ vaultsFolder: "./.obsidian-vaults/", vaults: [{ name: "rorz.io" }] }, "rorz.io").getFile("__missing__");',
        ].join("\n");
      }
    },
    name: "obsidian-renderer-test",
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

  // biome-ignore lint/style/noTernary: Normalizes Vite's single- and multi-build result shapes.
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

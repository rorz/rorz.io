import { expect, mock, test } from "bun:test";
import type {
  DevEnvironment,
  EnvironmentModuleNode,
  HotUpdateOptions,
  Plugin,
  ViteDevServer,
} from "vite";
import { obsid } from "./index.ts";

const getHotUpdate = (plugin: Plugin): ((options: HotUpdateOptions) => unknown) => {
  const { hotUpdate } = plugin;

  if (typeof hotUpdate !== "function") {
    throw new Error("Expected a hotUpdate hook");
  }

  return (options) => hotUpdate.call({} as never, options);
};

test("reloads the browser after invalidating vault modules in every environment", async () => {
  const vaultModule = {} as EnvironmentModuleNode;
  const virtualModule = {} as EnvironmentModuleNode;
  const invalidateModule = mock(() => undefined);
  const send = mock(() => undefined);
  const rscEnvironment = {
    moduleGraph: {
      getModuleById: () => virtualModule,
      getModulesByFile: () =>
        new Set([
          vaultModule,
        ]),
      invalidateModule,
    },
  } as unknown as DevEnvironment;
  const clientEnvironment = {
    moduleGraph: {
      getModuleById: () => undefined,
      getModulesByFile: () => undefined,
      invalidateModule,
    },
  } as unknown as DevEnvironment;
  const server = {
    config: {
      root: "/workspace",
    },
    environments: {
      client: clientEnvironment,
      rsc: rscEnvironment,
    },
    hot: {
      send,
    },
  } as unknown as ViteDevServer;
  const hotUpdate = getHotUpdate(
    obsid({
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./.obsidian-vaults/",
    }),
  );
  const update = {
    file: "/workspace/.obsidian-vaults/notes/page.md",
    modules: [],
    read: () => "",
    server,
    timestamp: 1,
    type: "update" as const,
  };

  await hotUpdate(update);
  await hotUpdate(update);

  expect(invalidateModule).toHaveBeenCalledTimes(2);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith({
    type: "full-reload",
  });
});

test("ignores Markdown outside the configured vault folder", async () => {
  const send = mock(() => undefined);
  const server = {
    config: {
      root: "/workspace",
    },
    environments: {},
    hot: {
      send,
    },
  } as unknown as ViteDevServer;
  const hotUpdate = getHotUpdate(
    obsid({
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./.obsidian-vaults/",
    }),
  );

  const result = await hotUpdate({
    file: "/workspace/content/page.md",
    modules: [],
    read: () => "",
    server,
    timestamp: 1,
    type: "update",
  });

  expect(result).toBeUndefined();
  expect(send).not.toHaveBeenCalled();
});

test("reloads the browser when a vault image changes", async () => {
  const send = mock(() => undefined);
  const server = {
    config: {
      root: "/workspace",
    },
    environments: {},
    hot: {
      send,
    },
  } as unknown as ViteDevServer;
  const hotUpdate = getHotUpdate(
    obsid({
      vaults: [
        {
          name: "notes",
        },
      ],
      vaultsFolder: "./.obsidian-vaults/",
    }),
  );

  await hotUpdate({
    file: "/workspace/.obsidian-vaults/notes/an_image.png",
    modules: [],
    read: () => "",
    server,
    timestamp: 1,
    type: "update",
  });

  expect(send).toHaveBeenCalledWith({
    type: "full-reload",
  });
});

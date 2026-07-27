// biome-ignore lint/correctness/noNodejsModules: Vite plugins execute in Node and receive filesystem paths.
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import type { EnvironmentModuleNode, Plugin, ViteDevServer } from "vite";
import type { VaultConfig } from "../vault/types.ts";
import { normalizeVaultsFolder } from "../vault/vault-path.ts";

const markdownExtension = ".md";
const virtualModuleId = "virtual:obsid/vault-files";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

const getVaultRoot = (config: VaultConfig): string => {
  const vaultRoot = normalizeVaultsFolder(config.vaultsFolder);

  if (!vaultRoot) {
    throw new Error(`Vaults folder must be relative to the Vite root: ${config.vaultsFolder}`);
  }

  return vaultRoot;
};

const renderVaultFilesModule = (config: VaultConfig): string => {
  const vaultRoot = getVaultRoot(config);
  const glob = `${vaultRoot}/**/*.md`;
  return `export const vaultFiles = import.meta.glob(${JSON.stringify(glob)}, { import: "default", query: "?raw" });`;
};

const isVaultMarkdownFile = (config: VaultConfig, viteRoot: string, file: string): boolean => {
  const vaultRoot = resolve(viteRoot, getVaultRoot(config).slice(1));
  const vaultPath = relative(vaultRoot, file);

  return (
    vaultPath !== ".." &&
    !vaultPath.startsWith(`..${sep}`) &&
    !isAbsolute(vaultPath) &&
    extname(vaultPath).toLowerCase() === markdownExtension
  );
};

const invalidateVaultModules = (server: ViteDevServer, file: string, timestamp: number): void => {
  for (const environment of Object.values(server.environments)) {
    const modules = new Set<EnvironmentModuleNode>(
      environment.moduleGraph.getModulesByFile(file) ?? [],
    );
    const virtualModule = environment.moduleGraph.getModuleById(resolvedVirtualModuleId);

    if (virtualModule) {
      modules.add(virtualModule);
    }

    const invalidatedModules = new Set<EnvironmentModuleNode>();

    for (const module of modules) {
      environment.moduleGraph.invalidateModule(module, invalidatedModules, timestamp, true);
    }
  }
};

const obsid = (config: VaultConfig): Plugin => {
  let lastHotUpdate: string | undefined;

  return {
    hotUpdate({ file, server, timestamp, type }) {
      if (!isVaultMarkdownFile(config, server.config.root, file)) {
        return;
      }

      const updateKey = `${type}:${timestamp}:${file}`;

      if (updateKey !== lastHotUpdate) {
        lastHotUpdate = updateKey;
        invalidateVaultModules(server, file, timestamp);
        server.hot.send({
          type: "full-reload",
        });
      }

      return [];
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return renderVaultFilesModule(config);
      }
    },
    name: "obsid",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
  };
};

export { obsid };

import type { Plugin } from "vite";
import type { VaultConfig } from "../vault/file-store.ts";
import { normalizeVaultsFolder } from "../vault/vault-path.ts";

const virtualModuleId = "virtual:obsid/vault-files";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

const renderVaultFilesModule = (config: VaultConfig): string => {
  const vaultRoot = normalizeVaultsFolder(config.vaultsFolder);

  if (!vaultRoot) {
    throw new Error(`Vaults folder must be relative to the Vite root: ${config.vaultsFolder}`);
  }

  const glob = `${vaultRoot}/**/*.md`;
  return `export const vaultFiles = import.meta.glob(${JSON.stringify(glob)}, { import: "default", query: "?raw" });`;
};

const obsid = (config: VaultConfig): Plugin => ({
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
});

export { obsid };

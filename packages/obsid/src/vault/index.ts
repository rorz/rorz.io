// biome-ignore lint/performance/noBarrelFile: This is the package's intentional public entry point.
export { getVault } from "./get-vault.ts";
export type {
  GetFile,
  GetVault,
  Vault,
  VaultConfig,
  VaultFile,
  VaultFrontmatter,
  VaultFrontmatterValue,
  VaultLink,
  VaultName,
} from "./types.ts";
export { isVaultLink } from "./wiki-link.ts";

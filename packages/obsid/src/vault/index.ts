// biome-ignore lint/performance/noBarrelFile: This is the package's intentional public entry point.
export { getVault } from "./get-vault.ts";
export type {
  GetFile,
  GetVault,
  Vault,
  VaultConfig,
  VaultFile,
  VaultFrontmatter,
  VaultLink,
  VaultName,
} from "./types.ts";

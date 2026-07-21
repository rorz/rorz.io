export type { GetFile, GetVault, Vault, VaultConfig, VaultFile, VaultName } from "./file-store.ts";
// biome-ignore lint/performance/noBarrelFile: This is the package's intentional public entry point.
export { getVault } from "./get-vault.ts";

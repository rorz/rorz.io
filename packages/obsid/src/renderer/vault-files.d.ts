declare module "virtual:obsid/vault-files" {
  export const vaultFiles: Readonly<Record<string, () => Promise<string>>>;
}

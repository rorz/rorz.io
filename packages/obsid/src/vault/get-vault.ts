/// <reference path="./vault-files.d.ts" />

import { vaultFiles } from "virtual:obsid/vault-files";
import { type GetVault, getVaultFromLoaders } from "./file-store.ts";

const getVault: GetVault = (config, name) => getVaultFromLoaders(vaultFiles, config, name);

export { getVault };

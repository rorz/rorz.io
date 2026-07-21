/// <reference path="./vault-files.d.ts" />

import { vaultFiles } from "virtual:obsid/vault-files";
import { getVaultFromLoaders } from "./file-store.ts";
import type { GetVault } from "./types.ts";

const getVault: GetVault = (config, name) => getVaultFromLoaders(vaultFiles, config, name);

export { getVault };
